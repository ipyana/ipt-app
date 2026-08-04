import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await params;
    const filepath = path.join(process.cwd(), "uploads", ...segments.map((s) => decodeURIComponent(s)));
    const s = await stat(filepath);
    if (!s.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }
    const data = await readFile(filepath);
    const ext = path.extname(filepath).toLowerCase();
    const types: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".txt": "text/plain",
      ".zip": "application/zip",
    };
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": types[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
