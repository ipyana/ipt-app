import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { sendAllocationEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const clusters = await prisma.cluster.findMany({ select: { id: true, name: true } });
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c.name]));

    const waitlisted = await prisma.application.findMany({
      where: { status: "waitlisted" },
      include: {
        student: { select: { id: true, studentId: true, fullName: true, department: true } },
      },
      orderBy: { waitlistedAt: "asc" },
    });

    const enriched = waitlisted.map((app) => ({
      ...app,
      pref1Name: clusterMap[app.clusterPref1] || "Unknown",
      pref2Name: clusterMap[app.clusterPref2] || "Unknown",
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const { applicationId } = await request.json();

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true },
    });
    if (!app || app.status !== "waitlisted") return err("Invalid application", 400);

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [app.clusterPref1, app.clusterPref2] } },
      include: { allowedDepartments: { include: { department: true } } },
    });

    const phases = await prisma.phase.findMany({
      where: { session: { isActive: true }, clusterId: { in: [app.clusterPref1, app.clusterPref2] } },
      orderBy: { phaseNumber: "asc" },
    });
    if (phases.length < 4) return err("Phases not configured", 400);

    const p1Cluster = clusters.find((c) => c.id === app.clusterPref1);
    const p1Cd = p1Cluster?.allowedDepartments?.find(
      (ad) => ad.department?.abbreviation === app.student.department
    );

    if (!p1Cd || p1Cd.enrolled >= p1Cd.slots) {
      return err(`No slots available in ${p1Cluster?.name || "cluster"}`, 409);
    }

    const p2Cluster = clusters.find((c) => c.id === app.clusterPref2);
    const p2Cd = p2Cluster?.allowedDepartments?.find(
      (ad) => ad.department?.abbreviation === app.student.department
    );

    const p1Phase1 = phases.find((ph) => ph.clusterId === app.clusterPref1 && ph.phaseNumber === 1);
    const p1Phase2 = phases.find((ph) => ph.clusterId === app.clusterPref1 && ph.phaseNumber === 2);
    const p2Phase1 = phases.find((ph) => ph.clusterId === app.clusterPref2 && ph.phaseNumber === 1);
    const p2Phase2 = phases.find((ph) => ph.clusterId === app.clusterPref2 && ph.phaseNumber === 2);

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: app.id },
        data: { status: "allocated", allocatedCluster: app.clusterPref1, waitlistedAt: null },
      });

      await tx.waitlistEntry.deleteMany({ where: { applicationId: app.id } });

      if (p1Phase1) {
        await tx.phaseAllocation.create({
          data: { phaseId: p1Phase1.id, applicationId: app.id, clusterId: app.clusterPref1 },
        });
      }
      if (p2Phase2 && p2Cd && p2Cd.enrolled < p2Cd.slots) {
        await tx.phaseAllocation.create({
          data: { phaseId: p2Phase2.id, applicationId: app.id, clusterId: app.clusterPref2 },
        });
      }

      await tx.clusterDepartment.update({
        where: { clusterId_departmentId: { clusterId: app.clusterPref1, departmentId: p1Cd.departmentId } },
        data: { enrolled: { increment: 1 } },
      });
      await tx.cluster.update({
        where: { id: app.clusterPref1 },
        data: { currentEnrolled: { increment: 1 } },
      });
    });

    const clusterName = p1Cluster?.name || "";
    const clusterLocation = p1Cluster?.location || "";

    await sendAllocationEmail({
      studentName: app.student.fullName,
      studentEmail: app.student.email,
      clusterName,
      clusterLocation,
      studentId: app.student.studentId,
    });

    return NextResponse.json({ success: true, applicationId });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const { applicationId } = await request.json();

    await prisma.$transaction(async (tx) => {
      await tx.waitlistEntry.deleteMany({ where: { applicationId } });
      await tx.application.update({
        where: { id: applicationId },
        data: { status: "pending", waitlistedAt: null },
      });
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
