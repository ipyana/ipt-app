import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function getCell(row: string[], i: number) {
  return (row[i] || "").replace(/^"|"$/g, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return NextResponse.json({ error: "CSV must have header and data rows" }, { status: 400 });

    const errors: string[] = [];
    let deptsCreated = 0, progsCreated = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");

        const deptName = getCell(cols, 0);
        const deptAbbrev = getCell(cols, 1);
        const progName = getCell(cols, 2);

        if (!deptName || !deptAbbrev) {
          errors.push(`Row ${i + 1}: department name and abbreviation required`);
          continue;
        }

        let dept = await prisma.department.findUnique({ where: { abbreviation: deptAbbrev } });
        if (!dept) {
          dept = await prisma.department.create({
            data: { name: deptName, abbreviation: deptAbbrev },
          });
          deptsCreated++;
        }

        if (progName) {
          const existing = await prisma.program.findUnique({ where: { name: progName } });
          if (!existing) {
            await prisma.program.create({
              data: { name: progName, departmentId: dept.id },
            });
            progsCreated++;
          }
        }
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return NextResponse.json({
      message: "Upload complete",
      summary: { departments: deptsCreated, programs: progsCreated },
      errors: errors.slice(0, 10),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
