import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    const app = await prisma.application.findUnique({
      where: { studentId: student.id },
      select: { allocatedCluster: true, clusterPref1: true, clusterPref2: true },
    });

    const clusters = new Set<number>();
    if (app?.allocatedCluster) clusters.add(app.allocatedCluster);
    if (app?.clusterPref1) clusters.add(app.clusterPref1);
    if (app?.clusterPref2) clusters.add(app.clusterPref2);
    if (clusters.size === 0) return NextResponse.json({ announcements: [], unreadCount: 0 });

    const announcements = await prisma.announcement.findMany({
      where: { clusterId: { in: Array.from(clusters) } },
      include: {
        staff: { select: { id: true, name: true } },
        cluster: { select: { id: true, name: true } },
        reads: { where: { studentId: student.id }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = announcements.filter((a) => a.reads.length === 0).length;

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        ...a,
        read: a.reads.length > 0,
        reads: undefined,
      })),
      unreadCount,
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
