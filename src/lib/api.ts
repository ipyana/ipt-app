import { NextResponse } from "next/server";

export function apiError(e: any, fallback = "Failed", status = 500) {
  if (e?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (e?.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (e?.code === "P2002") return NextResponse.json({ error: "That value already exists" }, { status: 409 });
  return NextResponse.json({ error: e?.message || fallback }, { status });
}

export function ok(data: any, status = 200) {
  return NextResponse.json(data, { status });
}
