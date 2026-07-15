import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    const programs = await prisma.program.findMany({
      include: { department: { select: { abbreviation: true, name: true } } },
      orderBy: { name: "asc" },
    });
    const clusters = await prisma.cluster.findMany({
      include: {
        allowedPrograms: {
          include: { program: { include: { department: { select: { abbreviation: true, name: true } } } } },
        },
      },
      orderBy: { name: "asc" },
    });

    const headers = [
      "department_abbreviation", "department_name", "program_name",
      "cluster_name", "cluster_location", "cluster_description",
      "slots",
    ];

    const rows: string[][] = [];

    for (const cluster of clusters) {
      if (cluster.allowedPrograms.length === 0) {
        rows.push(["", "", "", cluster.name, cluster.location, cluster.description.replace(/"/g, '""'), ""]);
      } else {
        for (const cp of cluster.allowedPrograms) {
          rows.push([
            cp.program.department.abbreviation,
            cp.program.department.name,
            cp.program.name,
            cluster.name,
            cluster.location,
            cluster.description.replace(/"/g, '""'),
            String(cp.slots),
          ]);
        }
      }
    }

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ipt-data-template.csv"`,
      },
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
