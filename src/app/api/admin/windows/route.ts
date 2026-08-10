import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { WINDOW_TYPES, WindowType } from "@/lib/windows";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireAdmin();
    const configs = await prisma.windowConfig.findMany({
      orderBy: [{ id: "asc" }],
    });
    return NextResponse.json(configs);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { type, enabled, startAt, endAt } = body;

    if (!type || !WINDOW_TYPES.includes(type)) {
      return err("Valid type (application/transfer/reapplication) is required", 400);
    }

    if (enabled === undefined) return err("enabled is required", 400);

    let sDate: Date | null = null;
    let eDate: Date | null = null;
    if (startAt) {
      sDate = new Date(startAt);
      if (isNaN(sDate.getTime())) return err("Invalid start date", 400);
    }
    if (endAt) {
      eDate = new Date(endAt);
      if (isNaN(eDate.getTime())) return err("Invalid end date", 400);
    }
    if (sDate && eDate && sDate.getTime() > eDate.getTime()) {
      return err("Start date/time must be before end date/time", 400);
    }

    const config = await prisma.windowConfig.upsert({
      where: { type: type as WindowType },
      update: { enabled: !!enabled, startAt: sDate, endAt: eDate },
      create: { type: type as WindowType, enabled: !!enabled, startAt: sDate, endAt: eDate },
    });

    return NextResponse.json(config);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
