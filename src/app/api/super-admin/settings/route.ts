import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const session = await prisma.iptSession.findFirst({ orderBy: { createdAt: "desc" } });
    const phases = session
      ? await prisma.phase.findMany({
          where: { sessionId: session.id },
          include: { cluster: { select: { id: true, name: true, location: true } } },
          orderBy: [{ phaseNumber: "asc" }, { clusterId: "asc" }],
        })
      : [];

    return NextResponse.json({ session, phases });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const { name, startDate, endDate, weeksPerPhase } = await request.json();
    if (!name || !startDate || !endDate) return err("Name, start date, and end date are required", 400);

    const existing = await prisma.iptSession.findFirst({ orderBy: { createdAt: "desc" } });

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const wpp = weeksPerPhase || 5;

    if (existing) {
      await prisma.iptSession.update({
        where: { id: existing.id },
        data: { name, startDate: sDate, endDate: eDate, weeksPerPhase: wpp },
      });

      const clusters = await prisma.cluster.findMany();
      await prisma.phase.deleteMany({ where: { sessionId: existing.id } });

      const midPoint = new Date(sDate.getTime() + Math.ceil(wpp * 7 * 24 * 60 * 60 * 1000));

      for (const cluster of clusters) {
        await prisma.phase.create({
          data: { sessionId: existing.id, phaseNumber: 1, clusterId: cluster.id, startDate: sDate, endDate: midPoint },
        });
        await prisma.phase.create({
          data: { sessionId: existing.id, phaseNumber: 2, clusterId: cluster.id, startDate: midPoint, endDate: eDate },
        });
      }

      return NextResponse.json({ success: true, session: existing.id });
    }

    const session = await prisma.iptSession.create({
      data: { name, startDate: sDate, endDate: eDate, weeksPerPhase: wpp, isActive: true },
    });

    const clusters = await prisma.cluster.findMany();
    const midPoint = new Date(sDate.getTime() + Math.ceil(wpp * 7 * 24 * 60 * 60 * 1000));

    for (const cluster of clusters) {
      await prisma.phase.create({
        data: { sessionId: session.id, phaseNumber: 1, clusterId: cluster.id, startDate: sDate, endDate: midPoint },
      });
      await prisma.phase.create({
        data: { sessionId: session.id, phaseNumber: 2, clusterId: cluster.id, startDate: midPoint, endDate: eDate },
      });
    }

    return NextResponse.json({ success: true, session: session.id }, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
