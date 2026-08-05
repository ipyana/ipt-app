import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireStaff();

    const staff = await prisma.staff.findUnique({
      where: { id: session.id },
      include: { cluster: { select: { id: true, name: true, location: true, capacity: true, currentEnrolled: true } } },
    });

    if (!staff || !staff.clusterId) return NextResponse.json(null);

    const phases = await prisma.phase.findMany({
      where: { clusterId: staff.clusterId, session: { isActive: true } },
      include: { groups: true },
      orderBy: { phaseNumber: "asc" },
    });

    const phase1 = phases.find((p) => p.phaseNumber === 1);
    const phase2 = phases.find((p) => p.phaseNumber === 2);

    const [phase1Students, phase2Students] = await Promise.all([
      phase1
        ? prisma.phaseAllocation.findMany({
            where: { phaseId: phase1.id },
            include: {
              group: { include: { venue: true } },
              application: { include: { student: { select: { id: true, studentId: true, fullName: true, program: true, department: true } } } },
            },
          })
        : Promise.resolve([]),
      phase2
        ? prisma.phaseAllocation.findMany({
            where: { phaseId: phase2.id },
            include: {
              group: { include: { venue: true } },
              application: { include: { student: { select: { id: true, studentId: true, fullName: true, program: true, department: true } } } },
            },
          })
        : Promise.resolve([]),
    ]);

    function buildPhaseData(phase: typeof phase1, allocations: typeof phase1Students) {
      if (!phase) return null;
      const byGroup = new Map<number, { id: number; name: string; venue: string | null; count: number }>();
      for (const pa of allocations) {
        if (!pa.group || !pa.groupId) continue;
        if (!byGroup.has(pa.groupId)) {
          byGroup.set(pa.groupId, {
            id: pa.group.id,
            name: pa.group.name,
            venue: pa.group.venue?.name || null,
            count: 0,
          });
        }
        byGroup.get(pa.groupId)!.count += 1;
      }
      return {
        id: phase.id,
        phaseNumber: phase.phaseNumber,
        startDate: phase.startDate,
        endDate: phase.endDate,
        enrolled: allocations.length,
        groups: Array.from(byGroup.values()),
      };
    }

    return NextResponse.json({
      staff,
      cluster: staff.cluster,
      capacity: staff.cluster?.capacity || 0,
      currentEnrolled: staff.cluster?.currentEnrolled || 0,
      phase1: buildPhaseData(phase1, phase1Students),
      phase2: buildPhaseData(phase2, phase2Students),
      phase1Students: phase1Students.map((pa) => ({
        id: pa.application.student.id,
        student: pa.application.student,
        group: pa.group ? { id: pa.group.id, name: pa.group.name, venue: pa.group.venue?.name || null } : null,
      })),
      phase2Students: phase2Students.map((pa) => ({
        id: pa.application.student.id,
        student: pa.application.student,
        group: pa.group ? { id: pa.group.id, name: pa.group.name, venue: pa.group.venue?.name || null } : null,
      })),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
