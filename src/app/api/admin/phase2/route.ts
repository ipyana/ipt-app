import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assignGroup } from "@/lib/groups";
import { sendPhase2ConfirmedEmail } from "@/lib/email";
import { sendEmailsInBatches } from "@/lib/batch";

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

    const clusters = await prisma.cluster.findMany();
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c]));
    const groups = await prisma.group.findMany({ where: { phaseId: { in: phases.map((p) => p.id) } }, include: { venue: true } });
    const groupMap = new Map<number, any>(groups.map((g) => [g.id, g]));

    let assigned = 0;

    const payloads: { app: any; phase2: any; group: any }[] = [];

    for (const app of apps) {
      const clusterId = app.allocatedCluster;
      if (!clusterId) continue;
      const phase2 = phase2ByCluster.get(clusterId);
      if (!phase2) continue;

      const existing = app.allocations.find((a: any) => a.phaseId === phase2.id);
      let gid: number | null = existing?.groupId ?? null;
      if (!existing) {
        gid = await assignGroup(clusterId, phase2.id);
        await prisma.phaseAllocation.create({
          data: { phaseId: phase2.id, applicationId: app.id, clusterId, groupId: gid },
        });
      } else if (!existing.groupId) {
        gid = await assignGroup(clusterId, phase2.id);
        await prisma.phaseAllocation.update({
          where: { id: existing.id },
          data: { groupId: gid },
        });
      }
      assigned++;

      payloads.push({ app, phase2, group: gid ? groupMap.get(gid) : null });
    }

    await sendEmailsInBatches(payloads, async ({ app, phase2, group }) => {
      await sendPhase2ConfirmedEmail({
        studentName: app.student.fullName,
        studentEmail: app.student.email,
        studentId: app.student.studentId,
        clusterName: clusterMap[app.allocatedCluster]?.name || "Your cluster",
        venue: group?.venue?.name || group?.name || "",
        group: group?.name || "",
        phaseDates: `${phase2.startDate.toLocaleDateString("en-TZ")} – ${phase2.endDate.toLocaleDateString("en-TZ")}`,
      });
      return true;
    });

    return NextResponse.json({ success: true, message: `Phase 2 allocation ready for ${assigned} students` });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
