import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assignGroup } from "@/lib/groups";
import { sendPhase2ConfirmedEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST() {
  try {
    await requireAdmin();

    const session = await prisma.iptSession.findFirst({ where: { isActive: true } });
    if (!session) return err("No active IPT session", 400);

    const apps = await prisma.application.findMany({
      where: { status: "allocated" },
      include: { student: true, allocations: true },
    });

    const phase2ByCluster = new Map<number, any>();
    const phases = await prisma.phase.findMany({
      where: { sessionId: session.id, phaseNumber: 2 },
    });
    for (const ph of phases) phase2ByCluster.set(ph.clusterId, ph);

    let assigned = 0;

    for (const app of apps) {
      const clusterId = app.allocatedCluster;
      if (!clusterId) continue;
      const phase2 = phase2ByCluster.get(clusterId);
      if (!phase2) continue;

      const existing = app.allocations.find((a: any) => a.phaseId === phase2.id);
      if (!existing) {
        const gid = await assignGroup(clusterId, phase2.id);
        await prisma.phaseAllocation.create({
          data: { phaseId: phase2.id, applicationId: app.id, clusterId, groupId: gid },
        });
      } else if (!existing.groupId) {
        const gid = await assignGroup(clusterId, phase2.id);
        await prisma.phaseAllocation.update({
          where: { id: existing.id },
          data: { groupId: gid },
        });
      }
      assigned++;

      const alloc = await prisma.phaseAllocation.findFirst({
        where: { applicationId: app.id, phaseId: phase2.id },
        include: { group: { include: { venue: true } } },
      });
      const cluster = await prisma.cluster.findUnique({ where: { id: clusterId } });

      try {
        await sendPhase2ConfirmedEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          clusterName: cluster?.name || "Your cluster",
          venue: alloc?.group?.venue?.name || alloc?.group?.name || "",
          group: alloc?.group?.name || "",
          phaseDates: `${phase2.startDate.toLocaleDateString("en-TZ")} – ${phase2.endDate.toLocaleDateString("en-TZ")}`,
        });
      } catch { /* continue */ }
    }

    return NextResponse.json({ success: true, message: `Phase 2 allocation ready for ${assigned} students` });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
