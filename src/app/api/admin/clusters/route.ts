import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clusterManageSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdmin();
    const clusters = await prisma.cluster.findMany({
      include: {
        staff: { select: { id: true, name: true, email: true } },
        allowedPrograms: { include: { program: { include: { department: { select: { name: true, abbreviation: true } } } } } },
      },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(clusters);
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = clusterManageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { programSlots, ...data } = parsed.data;

    const capacity = data.capacity || (programSlots?.reduce((s, p) => s + p.slots, 0) || 0);
    if (capacity < 1) return NextResponse.json({ error: "Capacity must be at least 1" }, { status: 400 });

    const cluster = await prisma.cluster.create({
      data: {
        ...data,
        capacity,
        description: data.description || "",
        location: data.location || "",
      },
    });

    if (programSlots?.length) {
      for (const ps of programSlots) {
        if (ps.slots > 0) {
          await prisma.clusterProgram.create({
            data: { clusterId: cluster.id, programId: ps.programId, slots: ps.slots },
          });
        }
      }
    }

    const created = await prisma.cluster.findUnique({
      where: { id: cluster.id },
      include: { allowedPrograms: { include: { program: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to create cluster" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...body } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const parsed = clusterManageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { programSlots, ...data } = parsed.data;

    const cluster = await prisma.cluster.update({
      where: { id },
      data: {
        ...data,
        description: data.description || "",
        location: data.location || "",
      },
    });

    if (programSlots) {
      await prisma.clusterProgram.deleteMany({ where: { clusterId: id } });
      for (const ps of programSlots) {
        if (ps.slots > 0) {
          await prisma.clusterProgram.create({
            data: { clusterId: id, programId: ps.programId, slots: ps.slots },
          });
        }
      }

      const newCapacity = programSlots.reduce((sum, ps) => sum + ps.slots, 0);
      await prisma.cluster.update({
        where: { id },
        data: { capacity: newCapacity },
      });
    }

    const updated = await prisma.cluster.findUnique({
      where: { id },
      include: {
        staff: true,
        allowedPrograms: { include: { program: { include: { department: { select: { name: true, abbreviation: true } } } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to update cluster" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.cluster.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
