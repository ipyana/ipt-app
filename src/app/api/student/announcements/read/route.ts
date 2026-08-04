import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    const app = await prisma.application.findUnique({
      where: { studentId: student.id },
      select: { allocatedCluster: true, clusterPref1: true, clusterPref2: true },
    });
    const clusters = new Set<number>();
    if (app?.allocatedCluster) clusters.add(app.allocatedCluster);
    if (app?.clusterPref1) clusters.add(app.clusterPref1);
    if (app?.clusterPref2) clusters.add(app.clusterPref2);
    if (clusters.size === 0) return NextResponse.json({ success: true });

    const where: any = { clusterId: { in: Array.from(clusters) } };
    if (id) where.id = Number(id);

    const announcements = await prisma.announcement.findMany({ where, select: { id: true } });
    for (const a of announcements) {
      await prisma.announcementRead.upsert({
        where: { announcementId_studentId: { announcementId: a.id, studentId: student.id } },
        update: {},
        create: { announcementId: a.id, studentId: student.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
