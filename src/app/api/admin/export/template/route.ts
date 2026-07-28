import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const clusters = await prisma.cluster.findMany({
      include: {
        allowedDepartments: { include: { department: { select: { abbreviation: true, name: true } } } },
      },
      orderBy: { name: "asc" },
    });

    const headers = [
      "department_abbreviation", "department_name",
      "cluster_name", "cluster_location", "cluster_description",
      "slots",
    ];

    const rows: string[][] = [];

    for (const cluster of clusters) {
      if (cluster.allowedDepartments.length === 0) {
        rows.push(["", "", cluster.name, cluster.location, cluster.description.replace(/"/g, '""'), ""]);
      } else {
        for (const cd of cluster.allowedDepartments) {
          rows.push([
            cd.department.abbreviation,
            cd.department.name,
            cluster.name,
            cluster.location,
            cluster.description.replace(/"/g, '""'),
            String(cd.slots),
          ]);
        }
      }
    }

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ipt-import-template-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
