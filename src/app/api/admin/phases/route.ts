import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireAdmin();
    const session = await prisma.iptSession.findFirst({
      where: { isActive: true },
      include: { phases: true },
    });
    if (!session) return NextResponse.json({ session: null, phases: [] });

    const phases = await prisma.phase.findMany({
      where: { sessionId: session.id },
      include: {
        cluster: true,
        _count: { select: { allocations: true } },
        groups: { include: { _count: { select: { allocations: true } } } },
      },
      orderBy: [{ phaseNumber: "asc" }, { clusterId: "asc" }],
    });

    return NextResponse.json({
      session: { id: session.id, name: session.name, startDate: session.startDate, endDate: session.endDate, weeksPerPhase: session.weeksPerPhase },
      phases: phases.map((p) => ({
        id: p.id,
        phaseNumber: p.phaseNumber,
        startDate: p.startDate,
        endDate: p.endDate,
        cluster: { id: p.cluster.id, name: p.cluster.name, location: p.cluster.location, capacity: p.cluster.capacity },
        enrolled: p._count.allocations,
        groups: p.groups.map((g) => ({ id: g.id, name: g.name, enrolled: g._count.allocations })),
      })),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
