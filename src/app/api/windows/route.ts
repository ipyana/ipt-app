import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWindowStatus, WINDOW_TYPES, WindowType } from "@/lib/windows";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const type = request.nextUrl.searchParams.get("type");
    if (!type || !WINDOW_TYPES.includes(type as WindowType)) {
      return err("Valid type (application/transfer/reapplication) is required", 400);
    }
    const status = await getWindowStatus(type as WindowType);
    return NextResponse.json(status);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
