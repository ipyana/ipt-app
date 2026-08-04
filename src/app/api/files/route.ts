import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";

const ALLOWED_PREFIXES = ["announcements/", "reports/"];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return new NextResponse("Missing key", { status: 400 });
  }

  if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const result = await readStoredFile(key);
  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(result.data), {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(key.split("/").pop() || "file")}"`,
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
