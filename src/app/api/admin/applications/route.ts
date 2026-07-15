import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const applications = await prisma.application.findMany({
      include: {
        student: { select: { studentId: true, fullName: true, department: true, program: true, email: true } },
      },
      orderBy: { submissionDate: "desc" },
    });

    const clusters = await prisma.cluster.findMany({
      select: { id: true, name: true },
    });

    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c.name]));

    const enriched = applications.map((app) => ({
      ...app,
      pref1Name: clusterMap[app.clusterPref1] || "Unknown",
      pref2Name: clusterMap[app.clusterPref2] || "Unknown",
      pref3Name: clusterMap[app.clusterPref3] || "Unknown",
      allocatedName: app.allocatedCluster ? clusterMap[app.allocatedCluster] : null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
