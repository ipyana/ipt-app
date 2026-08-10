import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { studentAdminSchema } from "@/lib/validations";
import { getStudentDepartmentSlot, releasePhaseSlot } from "@/lib/allocate";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const clusterId = Number(request.nextUrl.searchParams.get("clusterId") || "0");
    const status = request.nextUrl.searchParams.get("status") || undefined;
    // Deep allocation data is only needed for the cluster student list and the
    // per-student view dialog; the main table only needs status + cluster name.
    const withAllocations = request.nextUrl.searchParams.get("withAllocations") === "1" || clusterId > 0;
    const where: any = status ? { status } : {};
    if (clusterId) {
      where.applications = { some: { status: "allocated", allocatedCluster: clusterId } };
    }
    const students = await prisma.student.findMany({
      where,
      include: {
        applications: {
          select: {
            id: true, status: true, allocatedCluster: true, submissionDate: true,
            clusterPref1: true, clusterPref2: true,
            allocations: withAllocations
              ? {
                  include: {
                    phase: true,
                    cluster: { select: { id: true, name: true, location: true } },
                    group: { include: { venue: true } },
                  },
                }
              : false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clusters = await prisma.cluster.findMany({ select: { id: true, name: true } });
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c.name]));

    return NextResponse.json(
      students.map((s) => ({
        ...s,
        password: undefined,
        application: s.applications[0] || null,
        applications: undefined as any,
        allocatedName: s.applications[0]?.allocatedCluster ? clusterMap[s.applications[0].allocatedCluster] : null,
      }))
    );
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = studentAdminSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { password, ...rest } = parsed.data;
    if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });
    const hashed = await bcrypt.hash(password, 12);

    const existing = await prisma.student.findFirst({
      where: { OR: [{ email: rest.email }, { studentId: rest.studentId }] },
    });
    if (existing) return NextResponse.json({ error: "Student with that email or registration number already exists" }, { status: 409 });

    const student = await prisma.student.create({
      data: { ...rest, password: hashed, role: "student", status: "active", mustChangePassword: false },
    });

    return NextResponse.json({ ...student, password: undefined }, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...body } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const { password, studentId, fullName, email, department, program } = body;
    const updateData: any = {};
    if (studentId !== undefined) updateData.studentId = studentId;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (program !== undefined) updateData.program = program;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const student = await prisma.student.update({ where: { id }, data: updateData });
    return NextResponse.json({ ...student, password: undefined });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const ids = Array.isArray(body.ids)
      ? body.ids.map(Number).filter(Boolean)
      : body.id
        ? [Number(body.id)]
        : [];
    if (ids.length === 0) return NextResponse.json({ error: "ID or IDs required" }, { status: 400 });

    const studentsWithApps = await prisma.student.findMany({
      where: { id: { in: ids } },
      include: { applications: { include: { allocations: { include: { phase: true } } } } },
    });

    await prisma.$transaction(async (tx) => {
      // Release occupied phase slots before deleting.
      for (const s of studentsWithApps) {
        for (const app of s.applications) {
          const dept = s.department;
          const released = new Set<string>();
          for (const alloc of app.allocations) {
            const cd = await getStudentDepartmentSlot(alloc.clusterId, dept);
            if (!cd) continue;
            const key = `${alloc.clusterId}:${cd.departmentId}:${alloc.phase?.phaseNumber ?? 1}`;
            if (released.has(key)) continue;
            released.add(key);
            await releasePhaseSlot(tx, alloc.clusterId, cd.departmentId, alloc.phase?.phaseNumber ?? 1);
          }
        }
      }

      await tx.application.deleteMany({ where: { studentId: { in: ids } } });
      await tx.student.deleteMany({ where: { id: { in: ids } } });
    });
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
