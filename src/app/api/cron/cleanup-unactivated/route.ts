import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanupUnactivatedStudents, CLEANUP_DEFAULT_OLDER_THAN_MS } from "@/lib/cleanup";

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

    const result = await cleanupUnactivatedStudents(CLEANUP_DEFAULT_OLDER_THAN_MS);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return err("Failed", 500);
  }
}
