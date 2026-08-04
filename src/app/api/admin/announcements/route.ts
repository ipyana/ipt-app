import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteStoredFile } from "@/lib/storage";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireAdmin();
    const announcements = await prisma.announcement.findMany({
      include: {
        cluster: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(announcements);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    if (!id) return err("ID is required", 400);

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return err("Not found", 404);

    if (announcement.attachmentUrl) {
      const key = decodeURIComponent(announcement.attachmentUrl.split("key=").pop() || "");
      if (key) await deleteStoredFile(key);
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
