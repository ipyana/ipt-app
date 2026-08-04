import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendShiftReminderEmail } from "@/lib/email";

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
      include: { student: true, allocations: { include: { group: { include: { venue: true } } } } },
    });

    const phases = await prisma.phase.findMany({ where: { sessionId: session.id } });
    const phase2ByCluster = new Map<number, any>();
    for (const ph of phases) {
      if (ph.phaseNumber === 2) phase2ByCluster.set(ph.clusterId, ph);
    }
    const clusters = await prisma.cluster.findMany();
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c]));

    let sent = 0;
    for (const app of apps) {
      const clusterId = app.allocatedCluster;
      if (!clusterId) continue;
      const phase2 = phase2ByCluster.get(clusterId);
      if (!phase2) continue;
      const phase2Alloc = app.allocations.find((a: any) => a.phaseId === phase2.id);
      const venue = phase2Alloc?.group?.venue?.name || phase2Alloc?.group?.name || clusterMap[clusterId]?.location || "";
      const group = phase2Alloc?.group?.name || "";
      const nextCluster = (phase2Alloc?.clusterId && clusterMap[phase2Alloc.clusterId]?.name) || clusterMap[clusterId]?.name || "Your cluster";
      try {
        await sendShiftReminderEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          currentCluster: clusterMap[clusterId]?.name || "Your cluster",
          nextCluster,
          venue,
          group,
          shiftDate: phase2.startDate.toLocaleDateString("en-TZ", { day: "numeric", month: "long", year: "numeric" }),
        });
        sent++;
      } catch { /* continue */ }
    }

    return NextResponse.json({ success: true, message: `Reminder sent to ${sent} students` });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
