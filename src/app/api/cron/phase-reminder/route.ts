import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendShiftReminderEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || request.headers.get("x-cron-secret") || "";
    if (!CRON_SECRET || auth !== CRON_SECRET) {
      return err("Unauthorized", 401);
    }

    const session = await prisma.iptSession.findFirst({ where: { isActive: true } });
    if (!session) return err("No active session", 400);

    // Week 5 = the final week of phase 1. Wave = 1|2|3.
    const wave = Number(request.nextUrl.searchParams.get("wave") || "1");
    if (![1, 2, 3].includes(wave)) return err("wave must be 1, 2 or 3", 400);

    const waveKey = `shift_reminder_wave_${wave}`;
    const setting = await prisma.setting.findUnique({ where: { key: waveKey } });
    if (setting?.value === session.id.toString()) {
      return NextResponse.json({ success: true, message: "Wave already sent", skipped: true });
    }

    const apps = await prisma.application.findMany({
      where: { status: "allocated" },
      include: { student: true, allocations: { include: { group: { include: { venue: true } } } } },
    });

    const phases = await prisma.phase.findMany({ where: { sessionId: session.id } });
    const phase1ByCluster = new Map<number, any>();
    const phase2ByCluster = new Map<number, any>();
    for (const ph of phases) {
      if (ph.phaseNumber === 1) phase1ByCluster.set(ph.clusterId, ph);
      else phase2ByCluster.set(ph.clusterId, ph);
    }
    const clusters = await prisma.cluster.findMany();
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c]));

    let sent = 0;
    for (const app of apps) {
      const clusterId = app.allocatedCluster;
      if (!clusterId) continue;
      const phase1 = phase1ByCluster.get(clusterId);
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

    await prisma.setting.upsert({
      where: { key: waveKey },
      update: { value: session.id.toString() },
      create: { key: waveKey, value: session.id.toString() },
    });

    return NextResponse.json({ success: true, sent, wave });
  } catch (e: any) {
    return err("Failed", 500);
  }
}
