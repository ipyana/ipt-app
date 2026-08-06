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

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Number of weeks per phase (from active session)
async function getWeeksPerPhase(): Promise<number> {
  const session = await prisma.iptSession.findFirst({ where: { isActive: true } });
  return session?.weeksPerPhase || 5;
}

export async function GET() {
  try {
    const session = await requireAuth();

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
      include: { weeklyReports: { orderBy: [{ phaseNumber: "asc" }, { weekNumber: "asc" }] } },
    });

    if (!application) return err("No application found", 404);
    if (application.status !== "allocated") {
      return err("Reports are only available after allocation", 403);
    }

    const weeksPerPhase = await getWeeksPerPhase();
    const phases = await prisma.phase.findMany({
      where: { session: { isActive: true }, clusterId: application.allocatedCluster || 0 },
      orderBy: { phaseNumber: "asc" },
    });

    const weekInfo = (phaseNumber: number) => {
      const phase = phases.find((p) => p.phaseNumber === phaseNumber);
      if (!phase) return null;
      const totalMs = phase.endDate.getTime() - phase.startDate.getTime();
      const msPerWeek = totalMs / Math.max(weeksPerPhase, 1);
      const weeks = Array.from({ length: weeksPerPhase }, (_, i) => {
        const start = new Date(phase.startDate.getTime() + msPerWeek * i);
        const end = new Date(phase.startDate.getTime() + msPerWeek * (i + 1));
        return { weekNumber: i + 1, startDate: start, endDate: end };
      });
      return { phase, weeks };
    };

    const reportMap = new Map<string, any>();
    for (const r of application.weeklyReports) {
      reportMap.set(`${r.phaseNumber}-${r.weekNumber}`, r);
    }

    const phasesData: any[] = [];
    for (const phaseNumber of [1, 2]) {
      const info = weekInfo(phaseNumber);
      if (!info) continue;
      const weeks = info.weeks.map((w) => {
        const report = reportMap.get(`${phaseNumber}-${w.weekNumber}`) || null;
        return {
          weekNumber: w.weekNumber,
          startDate: w.startDate,
          endDate: w.endDate,
          reportUrl: report?.reportUrl || null,
          originalName: report?.originalName || null,
          submittedAt: report?.submittedAt || null,
          submitted: !!report,
        };
      });
      phasesData.push({
        phaseNumber,
        clusterId: info.phase.clusterId,
        startDate: info.phase.startDate,
        endDate: info.phase.endDate,
        weeks,
        submittedCount: weeks.filter((w) => w.submitted).length,
        totalWeeks: weeks.length,
      });
    }

    return NextResponse.json({
      weeksPerPhase,
      phases: phasesData,
      totalSubmitted: phasesData.reduce((s, p) => s + p.submittedCount, 0),
      totalWeeks: phasesData.reduce((s, p) => s + p.totalWeeks, 0),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });

    if (!application) return err("No application found", 404);
    if (application.status !== "allocated") {
      return err("Reports can only be uploaded after allocation", 403);
    }

    const formData = await request.formData();
    const file = formData.get("report") as File | null;
    const phaseNumber = Number(formData.get("phaseNumber"));
    const weekNumber = Number(formData.get("weekNumber"));

    if (!file) return err("No file provided", 400);
    if (!phaseNumber || !weekNumber) return err("Phase and week are required", 400);
    if (phaseNumber !== 1 && phaseNumber !== 2) return err("Invalid phase", 400);

    const weeksPerPhase = await getWeeksPerPhase();
    if (weekNumber < 1 || weekNumber > weeksPerPhase) {
      return err(`Week must be between 1 and ${weeksPerPhase}`, 400);
    }

    if (file.size > MAX_FILE_SIZE) return err("File size must be under 10MB", 400);
    if (!ALLOWED_TYPES.includes(file.type)) {
      return err("Only PDF and Word documents are allowed", 400);
    }

    const uploadDir = path.join(process.cwd(), "uploads", "weekly");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".pdf";
    const safeExt = [".pdf", ".doc", ".docx"].includes(ext.toLowerCase()) ? ext.toLowerCase() : ".pdf";
    const filename = `${session.studentId}_p${phaseNumber}_w${weekNumber}_${Date.now()}${safeExt}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const reportUrl = `/uploads/weekly/${filename}`;

    // Upsert: once submitted, do not allow overwrite (no withdraw)
    const existing = await prisma.weeklyReport.findUnique({
      where: { applicationId_phaseNumber_weekNumber: { applicationId: application.id, phaseNumber, weekNumber } },
    });
    if (existing) {
      return err("This week's report has already been submitted and cannot be changed", 409);
    }

    await prisma.weeklyReport.create({
      data: {
        applicationId: application.id,
        phaseNumber,
        weekNumber,
        reportUrl,
        originalName: file.name,
      },
    });

    return NextResponse.json({ url: reportUrl, phaseNumber, weekNumber }, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Upload failed", 500);
  }
}
