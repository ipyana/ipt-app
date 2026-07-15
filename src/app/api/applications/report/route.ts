import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });

    if (!application) {
      return NextResponse.json({ error: "No application found" }, { status: 404 });
    }

    if (application.status !== "allocated") {
      return NextResponse.json({ error: "Reports can only be uploaded after allocation" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("report") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 10MB" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF and Word documents are allowed" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".pdf";
    const filename = `${session.studentId}_${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const reportUrl = `/uploads/reports/${filename}`;

    await prisma.application.update({
      where: { studentId: session.id },
      data: { reportUrl },
    });

    return NextResponse.json({ url: reportUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
