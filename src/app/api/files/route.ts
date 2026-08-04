import { NextRequest, NextResponse } from "next/server";
import { readStoredFile } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return new NextResponse("Missing key", { status: 400 });
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
