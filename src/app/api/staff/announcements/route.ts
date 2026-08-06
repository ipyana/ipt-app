import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff) return err("Staff not found", 404);

    const announcements = await prisma.announcement.findMany({
      where: { audience: { in: ["staff", "all"] } },
      include: {
        staff: { select: { id: true, name: true } },
        cluster: { select: { id: true, name: true } },
        staffReads: { where: { staffId: staff.id }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = announcements.filter((a) => a.staffReads.length === 0).length;

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        ...a,
        read: a.staffReads.length > 0,
        staffReads: undefined,
      })),
      unreadCount,
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
