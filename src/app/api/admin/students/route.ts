import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { studentAdminSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireAdmin();
    const students = await prisma.student.findMany({
      include: {
        applications: { select: { id: true, status: true, allocatedCluster: true, submissionDate: true } },
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
    const hashed = await bcrypt.hash(password || "Student@123", 12);

    const existing = await prisma.student.findFirst({
      where: { OR: [{ email: rest.email }, { studentId: rest.studentId }] },
    });
    if (existing) return NextResponse.json({ error: "Student with that email or registration number already exists" }, { status: 409 });

    const student = await prisma.student.create({
      data: { ...rest, password: hashed, role: "student" },
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

    const { password, ...rest } = body;
    const updateData: any = { ...rest };
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
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
