import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cleanupUnactivatedStudents, CLEANUP_DEFAULT_OLDER_THAN_MS } from "@/lib/cleanup";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireAdmin();
    const pending = await prisma.student.count({ where: { status: "pending_activation" } });
    const active = await prisma.student.count({ where: { status: "active" } });
    return NextResponse.json({ pending, active, total: pending + active });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const olderThanHours = Number(body?.olderThanHours || 0);
    const olderThanMs = olderThanHours > 0 ? olderThanHours * 60 * 60 * 1000 : CLEANUP_DEFAULT_OLDER_THAN_MS;

    const result = await cleanupUnactivatedStudents(olderThanMs);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Cleanup failed", 500);
  }
}
