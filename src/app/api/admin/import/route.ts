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
    if (lines.length < 2) return NextResponse.json({ error: "CSV must have a header row and data" }, { status: 400 });

    const errors: string[] = [];
    let deptsCreated = 0, progsCreated = 0, clustersCreated = 0, allocationsCreated = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");

        const deptAbbrev = getCell(cols, 0);
        const deptName = getCell(cols, 1);
        const progName = getCell(cols, 2);
        const clusterName = getCell(cols, 3);
        const clusterLocation = getCell(cols, 4);
        const clusterDesc = getCell(cols, 5);
        const slots = parseInt(getCell(cols, 6)) || 0;

        if (!deptAbbrev || !progName || !clusterName) {
          errors.push(`Row ${i + 1}: missing required fields`);
          continue;
        }

        let department = await prisma.department.findUnique({ where: { abbreviation: deptAbbrev } });
        if (!department) {
          department = await prisma.department.create({
            data: { abbreviation: deptAbbrev, name: deptName || deptAbbrev },
          });
          deptsCreated++;
        }

        let program = await prisma.program.findUnique({ where: { name: progName } });
        if (!program) {
          program = await prisma.program.create({
            data: { name: progName, departmentId: department.id },
          });
          progsCreated++;
        }

        let cluster = await prisma.cluster.findUnique({ where: { name: clusterName } });
        if (!cluster) {
          cluster = await prisma.cluster.create({
            data: { name: clusterName, location: clusterLocation, description: clusterDesc, capacity: slots },
          });
          clustersCreated++;
        }

        if (slots > 0) {
          const existing = await prisma.clusterProgram.findUnique({
            where: { clusterId_programId: { clusterId: cluster.id, programId: program.id } },
          });
          if (!existing) {
            await prisma.clusterProgram.create({
              data: { clusterId: cluster.id, programId: program.id, slots },
            });
            allocationsCreated++;
          } else if (existing.slots !== slots) {
            await prisma.clusterProgram.update({
              where: { clusterId_programId: { clusterId: cluster.id, programId: program.id } },
              data: { slots },
            });
            allocationsCreated++;
          }
        }
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return NextResponse.json({
      message: "Import complete",
      summary: { departments: deptsCreated, programs: progsCreated, clusters: clustersCreated, allocations: allocationsCreated },
      errors: errors.slice(0, 10),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
