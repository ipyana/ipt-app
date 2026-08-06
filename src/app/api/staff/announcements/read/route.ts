import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff) return err("Staff not found", 404);

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    const where: any = { audience: { in: ["staff", "all"] } };
    if (id) where.id = Number(id);

    const announcements = await prisma.announcement.findMany({ where, select: { id: true } });
    for (const a of announcements) {
      await prisma.staffAnnouncementRead.upsert({
        where: { announcementId_staffId: { announcementId: a.id, staffId: staff.id } },
        update: {},
        create: { announcementId: a.id, staffId: staff.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
