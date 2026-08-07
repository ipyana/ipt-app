import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { sendGroupUpdatedEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({
      where: { id: session.id },
      include: { cluster: { select: { id: true, name: true } } },
    });
    if (!staff || !staff.clusterId) return err("You are not assigned to any cluster", 403);

    const phases = await prisma.phase.findMany({
      where: { clusterId: staff.clusterId, session: { isActive: true } },
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

    const venues = await prisma.venue.findMany({ where: { clusterId: staff.clusterId } });

    return NextResponse.json({ cluster: staff.cluster, phases, venues });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff || !staff.clusterId) return err("You are not assigned to any cluster", 403);

    const body = await request.json();
    const { action } = body;

    if (action === "create-group") {
      const { phaseId, name, venueId, location, capacity } = body;
      if (!phaseId || !name) return err("Phase ID and group name are required", 400);
      const phase = await prisma.phase.findFirst({ where: { id: phaseId, clusterId: staff.clusterId } });
      if (!phase) return err("Invalid phase", 400);
      const venue = venueId ? await prisma.venue.findUnique({ where: { id: Number(venueId) } }) : null;
      const group = await prisma.group.create({
        data: {
          clusterId: staff.clusterId,
          phaseId,
          venueId: venueId ? Number(venueId) : null,
          name,
          location: location?.trim() || venue?.name || "",
          capacity: capacity ? Number(capacity) : 0,
        },
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
      if (!group || group.clusterId !== staff.clusterId || group.phaseId !== allocation.phaseId) {
        return err("Invalid group for this phase", 400);
      }

      const cluster = await prisma.cluster.findUnique({ where: { id: staff.clusterId } });

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
          venue: group.location || group.venue?.name || group.name,
          group: group.name,
        });
      } catch { /* non-blocking */ }

      return NextResponse.json({ success: true });
    }

    return err("Invalid action", 400);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
