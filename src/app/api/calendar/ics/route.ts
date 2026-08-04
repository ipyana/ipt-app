import { NextRequest, NextResponse } from "next/server";
import { buildIcs } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title") || "IPT Schedule";
  const description = request.nextUrl.searchParams.get("description") || "";
  const location = request.nextUrl.searchParams.get("location") || "";
  const start = request.nextUrl.searchParams.get("start") || "";
  const end = request.nextUrl.searchParams.get("end") || "";

  if (!start || !end) {
    return new NextResponse("Missing start/end dates", { status: 400 });
  }

  const ics = buildIcs({ title, description, location, startDate: start, endDate: end });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=ipt-schedule.ics",
    },
  });
}
