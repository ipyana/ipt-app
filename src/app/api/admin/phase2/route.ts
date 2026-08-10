import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assignGroup } from "@/lib/groups";
import { sendPhase2ConfirmedEmail } from "@/lib/email";
import { sendEmailsInBatches } from "@/lib/batch";
import { reservePhaseSlot, getStudentDepartmentSlot } from "@/lib/allocate";

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

    const phases = await prisma.phase.findMany({
      where: { sessionId: session.id, phaseNumber: 2 },
    });
    const phase2ByCluster = new Map<number, any>(phases.map((p) => [p.clusterId, p]));
    const phase2Ids = new Set(phases.map((p) => p.id));

    const clusters = await prisma.cluster.findMany();
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c]));
    const groups = await prisma.group.findMany({ where: { phaseId: { in: phases.map((p) => p.id) } }, include: { venue: true } });
    const groupMap = new Map<number, any>(groups.map((g) => [g.id, g]));

    let assigned = 0;

    const payloads: { app: any; phase2: any; group: any }[] = [];

    for (const app of apps) {
      // Does this application already have a phase-2 allocation (in ANY cluster)?
      // Self-service apps get one in their 2nd-preference cluster at apply time.
      const existing = app.allocations.find((a: any) => phase2Ids.has(a.phaseId));

      if (existing) {
        // Only fill in the group if missing — never create a duplicate.
        if (!existing.groupId) {
          const gid = await assignGroup(existing.clusterId, existing.phaseId);
          await prisma.phaseAllocation.update({
            where: { id: existing.id },
            data: { groupId: gid },
          });
        }
        payloads.push({
          app,
          phase2: phases.find((p) => p.id === existing.phaseId),
          group: existing.groupId ? groupMap.get(existing.groupId) : null,
        });
        assigned++;
        continue;
      }

      // No phase-2 yet: place it in the student's 2nd preference cluster first,
      // falling back to the allocated cluster (admin-allocated students).
      let targetClusterId: number | null = null;
      const pref2Phase = app.clusterPref2 ? phase2ByCluster.get(app.clusterPref2) : null;
      if (pref2Phase) {
        targetClusterId = app.clusterPref2;
      } else if (app.allocatedCluster && phase2ByCluster.get(app.allocatedCluster)) {
        targetClusterId = app.allocatedCluster;
      }
      if (!targetClusterId) continue;

      // Reserve a phase-2 slot; skip (leave waitlisted) if the cluster is full for phase 2.
      const cd = await getStudentDepartmentSlot(targetClusterId, app.student.department);
      if (!cd || cd.phase2Enrolled >= cd.slots) continue;

      const phase2 = phase2ByCluster.get(targetClusterId);
      const gid = await assignGroup(targetClusterId, phase2.id);
      await prisma.$transaction(async (tx) => {
        await tx.phaseAllocation.create({
          data: { phaseId: phase2.id, applicationId: app.id, clusterId: targetClusterId, groupId: gid },
        });
        const ok = await reservePhaseSlot(tx, targetClusterId, cd.departmentId, 2);
        if (!ok) throw new Error("Phase 2 slot no longer available");
      });
      assigned++;

      payloads.push({ app, phase2, group: gid ? groupMap.get(gid) : null });
    }

    await sendEmailsInBatches(payloads, async ({ app, phase2, group }) => {
      await sendPhase2ConfirmedEmail({
        studentName: app.student.fullName,
        studentEmail: app.student.email,
        studentId: app.student.studentId,
        clusterName: clusterMap[phase2?.clusterId]?.name || "Your cluster",
        venue: group?.location || group?.venue?.name || group?.name || "",
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
