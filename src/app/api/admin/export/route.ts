import { NextResponse } from "next/server";
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

    const clusters = await prisma.cluster.findMany({ select: { id: true, name: true } });
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c.name]));

    const headers = [
      "Student ID",
      "Full Name",
      "Department",
      "Program",
      "Email",
      "Preference 1",
      "Preference 2",
      "Preference 3",
      "Status",
      "Allocated Cluster",
      "Submission Date",
    ];

    const rows = applications.map((app) => [
      app.student.studentId,
      app.student.fullName,
      app.student.department,
      app.student.program,
      app.student.email,
      clusterMap[app.clusterPref1] || "",
      clusterMap[app.clusterPref2] || "",
      clusterMap[app.clusterPref3] || "",
      app.status,
      app.allocatedCluster ? clusterMap[app.allocatedCluster] : "",
      app.submissionDate.toISOString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ipt-applications-${new Date().toISOString().split("T")[0]}.csv"`,
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
