import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendGroupUpdatedEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const clusterId = Number(request.nextUrl.searchParams.get("clusterId") || "0");
    if (!clusterId) return err("clusterId is required", 400);

    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
      select: { id: true, name: true },
    });
    if (!cluster) return err("Cluster not found", 404);

    const phases = await prisma.phase.findMany({
      where: { clusterId, session: { isActive: true } },
      include: {
        groups: { include: { venue: true, _count: { select: { allocations: true } } } },
        allocations: {
          include: {
            application: { include: { student: { select: { id: true, studentId: true, fullName: true, department: true, program: true } } } },
          },
        },
      },
      orderBy: { phaseNumber: "asc" },
    });

    const venues = await prisma.venue.findMany({ where: { clusterId } });

    return NextResponse.json({ cluster, phases, venues });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, clusterId } = body;

    if (action === "create-group") {
      const { phaseId, name, venueId } = body;
      if (!phaseId || !name) return err("Phase ID and group name are required", 400);
      const phase = await prisma.phase.findFirst({ where: { id: phaseId, clusterId } });
      if (!phase) return err("Invalid phase", 400);
      const group = await prisma.group.create({
        data: { clusterId, phaseId, venueId: venueId ? Number(venueId) : null, name },
      });
      return NextResponse.json(group, { status: 201 });
    }

    if (action === "move-student") {
      const { allocationId, groupId } = body;
      if (!allocationId || !groupId) return err("Allocation ID and group ID are required", 400);

      const allocation = await prisma.phaseAllocation.findUnique({
        where: { id: allocationId },
        include: {
          application: { include: { student: true } },
          group: { include: { venue: true } },
          phase: { select: { phaseNumber: true, clusterId: true } },
        },
      });
      if (!allocation) return err("Allocation not found", 404);

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { venue: true, phase: true },
      });
      if (!group || group.phaseId !== allocation.phaseId) return err("Invalid group for this phase", 400);

      const cluster = await prisma.cluster.findUnique({ where: { id: allocation.phase.clusterId } });

      await prisma.phaseAllocation.update({
        where: { id: allocationId },
        data: { groupId: group.id },
      });

      try {
        await sendGroupUpdatedEmail({
          studentName: allocation.application.student.fullName,
          studentEmail: allocation.application.student.email,
          studentId: allocation.application.student.studentId,
          clusterName: cluster?.name || "Your cluster",
          phaseLabel: `Phase ${allocation.phase?.phaseNumber || 1}`,
          venue: group.venue?.name || group.name,
          group: group.name,
        });
      } catch { /* non-blocking */ }

      return NextResponse.json({ success: true });
    }

    if (action === "auto-balance") {
      const { phaseId } = body;
      if (!phaseId) return err("phaseId is required", 400);
      const phase = await prisma.phase.findFirst({ where: { id: phaseId, clusterId } });
      if (!phase) return err("Invalid phase", 400);

      const allocations = await prisma.phaseAllocation.findMany({ where: { phaseId } });
      const groups = await prisma.group.findMany({ where: { phaseId }, orderBy: { id: "asc" } });
      if (groups.length === 0) return err("No groups exist for this phase", 400);

      const groupQueue = [...groups];
      let qi = 0;
      for (const alloc of allocations) {
        const g = groupQueue[qi % groupQueue.length];
        await prisma.phaseAllocation.update({ where: { id: alloc.id }, data: { groupId: g.id } });
        qi++;
      }
      return NextResponse.json({ success: true, message: `Balanced ${allocations.length} students across ${groups.length} groups` });
    }

    return err("Invalid action", 400);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
