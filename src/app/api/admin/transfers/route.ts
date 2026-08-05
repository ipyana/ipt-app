import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendTransferApprovedEmail, sendTransferRejectedEmail, sendReapplicationResultEmail } from "@/lib/email";
import { assignGroup } from "@/lib/groups";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireAdmin();

    const clusters = await prisma.cluster.findMany({ select: { id: true, name: true } });
    const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c.name]));

    const transfers = await prisma.transferRequest.findMany({
      include: {
        application: {
          include: {
            student: { select: { id: true, studentId: true, fullName: true, program: true, department: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const enriched = transfers.map((t) => ({
      ...t,
      fromClusterName: clusterMap[t.fromClusterId] || "Unknown",
      toClusterName: t.toClusterId ? clusterMap[t.toClusterId] || "Unknown" : "2 new clusters",
      pref1NewName: t.pref1New ? clusterMap[t.pref1New] || "Unknown" : null,
      pref2NewName: t.pref2New ? clusterMap[t.pref2New] || "Unknown" : null,
      currentAllocName: t.application.allocatedCluster ? clusterMap[t.application.allocatedCluster] || "Unknown" : null,
      oldPref1Name: t.application.clusterPref1 ? clusterMap[t.application.clusterPref1] || "Unknown" : null,
      oldPref2Name: t.application.clusterPref2 ? clusterMap[t.application.clusterPref2] || "Unknown" : null,
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
    const admin = await requireAdmin();

    const { id, action, notes } = await request.json();
    if (!id || !["approve", "reject"].includes(action)) {
      return err("ID and action (approve/reject) are required", 400);
    }

    const transfer = await prisma.transferRequest.findUnique({
      where: { id },
      include: { application: { include: { student: true, allocations: true } } },
    });
    if (!transfer || transfer.status !== "pending") {
      return err("Transfer request not found or already processed", 400);
    }

    const app = transfer.application;

    if (action === "approve") {
      if (transfer.type === "reapplication") {
        const newPref1 = transfer.pref1New!;
        const newPref2 = transfer.pref2New!;

        const cd1 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: newPref1, department: { abbreviation: app.student.department } },
        });
        const cd2 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: newPref2, department: { abbreviation: app.student.department } },
        });
        if (!cd1 || !cd2 || cd1.enrolled >= cd1.slots || cd2.enrolled >= cd2.slots) {
          return err("No available slots in one or both target clusters", 409);
        }

        const oldCd1 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: app.clusterPref1, department: { abbreviation: app.student.department } },
        });
        const oldCd2 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: app.clusterPref2, department: { abbreviation: app.student.department } },
        });

        await prisma.$transaction(async (tx) => {
          await tx.transferRequest.update({
            where: { id },
            data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
          });
          await tx.application.update({
            where: { id: app.id },
            data: { status: "allocated", clusterPref1: newPref1, clusterPref2: newPref2, allocatedCluster: newPref1 },
          });

          if (oldCd1) {
            await tx.clusterDepartment.update({
              where: { clusterId_departmentId: { clusterId: app.clusterPref1, departmentId: oldCd1.departmentId } },
              data: { enrolled: { decrement: 1 } },
            });
          }
          if (oldCd2) {
            await tx.clusterDepartment.update({
              where: { clusterId_departmentId: { clusterId: app.clusterPref2, departmentId: oldCd2.departmentId } },
              data: { enrolled: { decrement: 1 } },
            });
          }

          await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: newPref1, departmentId: cd1.departmentId } },
            data: { enrolled: { increment: 1 } },
          });
          await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: newPref2, departmentId: cd2.departmentId } },
            data: { enrolled: { increment: 1 } },
          });

          await tx.phaseAllocation.deleteMany({ where: { applicationId: app.id } });

          const phases = await tx.phase.findMany({
            where: { session: { isActive: true }, clusterId: { in: [newPref1, newPref2] } },
            orderBy: { phaseNumber: "asc" },
          });

          const p1Ph1 = phases.find((p) => p.clusterId === newPref1 && p.phaseNumber === 1);
          const p2Ph2 = phases.find((p) => p.clusterId === newPref2 && p.phaseNumber === 2);
          const g1 = p1Ph1 ? await assignGroup(newPref1, p1Ph1.id) : null;
          const g2 = p2Ph2 ? await assignGroup(newPref2, p2Ph2.id) : null;
          if (p1Ph1) await tx.phaseAllocation.create({ data: { phaseId: p1Ph1.id, applicationId: app.id, clusterId: newPref1, groupId: g1 } });
          if (p2Ph2) await tx.phaseAllocation.create({ data: { phaseId: p2Ph2.id, applicationId: app.id, clusterId: newPref2, groupId: g2 } });
        });

        const [cluster1, cluster2] = await Promise.all([
          prisma.cluster.findUnique({ where: { id: newPref1 } }),
          prisma.cluster.findUnique({ where: { id: newPref2 } }),
        ]);
        await sendReapplicationResultEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          status: "approved",
          cluster1: cluster1?.name || "Unknown",
          cluster2: cluster2?.name || "Unknown",
        });

        return NextResponse.json({ success: true, message: "Reapplication approved" });
      }

      // Transfer changing BOTH clusters (pref1New + pref2New)
      if (transfer.pref1New && transfer.pref2New) {
        const newPref1 = transfer.pref1New;
        const newPref2 = transfer.pref2New;

        const cd1 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: newPref1, department: { abbreviation: app.student.department } },
        });
        const cd2 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: newPref2, department: { abbreviation: app.student.department } },
        });
        if (!cd1 || !cd2 || cd1.enrolled >= cd1.slots || cd2.enrolled >= cd2.slots) {
          return err("No available slots in one or both target clusters", 409);
        }

        const oldPref1 = app.clusterPref1;
        const oldPref2 = app.clusterPref2;
        const oldCd1 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: oldPref1, department: { abbreviation: app.student.department } },
        });
        const oldCd2 = await prisma.clusterDepartment.findFirst({
          where: { clusterId: oldPref2, department: { abbreviation: app.student.department } },
        });

        await prisma.$transaction(async (tx) => {
          await tx.transferRequest.update({
            where: { id },
            data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
          });
          await tx.application.update({
            where: { id: app.id },
            data: { status: "allocated", clusterPref1: newPref1, clusterPref2: newPref2, allocatedCluster: newPref1 },
          });

          if (oldCd1) await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: oldPref1, departmentId: oldCd1.departmentId } },
            data: { enrolled: { decrement: 1 } },
          });
          if (oldCd2) await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: oldPref2, departmentId: oldCd2.departmentId } },
            data: { enrolled: { decrement: 1 } },
          });

          await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: newPref1, departmentId: cd1.departmentId } },
            data: { enrolled: { increment: 1 } },
          });
          await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: newPref2, departmentId: cd2.departmentId } },
            data: { enrolled: { increment: 1 } },
          });

          await tx.phaseAllocation.deleteMany({ where: { applicationId: app.id } });

          const phases = await tx.phase.findMany({
            where: { session: { isActive: true }, clusterId: { in: [newPref1, newPref2] } },
            orderBy: { phaseNumber: "asc" },
          });

          const p1Ph1 = phases.find((p) => p.clusterId === newPref1 && p.phaseNumber === 1);
          const p2Ph2 = phases.find((p) => p.clusterId === newPref2 && p.phaseNumber === 2);
          const g1 = p1Ph1 ? await assignGroup(newPref1, p1Ph1.id) : null;
          const g2 = p2Ph2 ? await assignGroup(newPref2, p2Ph2.id) : null;
          if (p1Ph1) await tx.phaseAllocation.create({ data: { phaseId: p1Ph1.id, applicationId: app.id, clusterId: newPref1, groupId: g1 } });
          if (p2Ph2) await tx.phaseAllocation.create({ data: { phaseId: p2Ph2.id, applicationId: app.id, clusterId: newPref2, groupId: g2 } });
        });

        const [cluster1, cluster2] = await Promise.all([
          prisma.cluster.findUnique({ where: { id: newPref1 } }),
          prisma.cluster.findUnique({ where: { id: newPref2 } }),
        ]);
        await sendTransferApprovedEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          clusterName: cluster1?.name || "Unknown",
          clusterLocation: cluster1?.location || "",
        });

        return NextResponse.json({ success: true, message: "Transfer approved" });
      }

      // Single cluster transfer
      const toClusterId = transfer.toClusterId!;
      const cd = await prisma.clusterDepartment.findFirst({
        where: { clusterId: toClusterId, department: { abbreviation: app.student.department } },
      });
      if (!cd || cd.enrolled >= cd.slots) {
        return err("No available slots in the target cluster", 409);
      }

      const oldCd = await prisma.clusterDepartment.findFirst({
        where: { clusterId: transfer.fromClusterId, department: { abbreviation: app.student.department } },
      });

      await prisma.$transaction(async (tx) => {
        await tx.transferRequest.update({
          where: { id },
          data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
        });
        await tx.application.update({
          where: { id: app.id },
          data: { status: "allocated", allocatedCluster: toClusterId },
        });

        if (oldCd) {
          await tx.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: transfer.fromClusterId, departmentId: oldCd.departmentId } },
            data: { enrolled: { decrement: 1 } },
          });
          await tx.cluster.update({
            where: { id: transfer.fromClusterId },
            data: { currentEnrolled: { decrement: 1 } },
          });
        }

        await tx.clusterDepartment.update({
          where: { clusterId_departmentId: { clusterId: toClusterId, departmentId: cd.departmentId } },
          data: { enrolled: { increment: 1 } },
        });
        await tx.cluster.update({
          where: { id: toClusterId },
          data: { currentEnrolled: { increment: 1 } },
        });

        const phases = await tx.phase.findMany({
          where: { session: { isActive: true }, clusterId: { in: [transfer.fromClusterId, toClusterId] } },
        });

        const phaseByNumber = new Map<number, any>();
        for (const ph of phases) {
          if (ph.clusterId === toClusterId) phaseByNumber.set(ph.phaseNumber, ph);
        }

        for (const alloc of app.allocations) {
          const origPhase = phases.find((p) => p.id === alloc.phaseId);
          const targetPhase = origPhase ? phaseByNumber.get(origPhase.phaseNumber) : null;
          const gid = targetPhase ? await assignGroup(toClusterId, targetPhase.id) : null;
          const newPhaseId = targetPhase ? targetPhase.id : alloc.phaseId;
          await tx.phaseAllocation.update({
            where: { id: alloc.id },
            data: { clusterId: toClusterId, phaseId: newPhaseId, groupId: gid },
          });
        }
      });

      const targetCluster = await prisma.cluster.findUnique({ where: { id: toClusterId } });
      await sendTransferApprovedEmail({
        studentName: app.student.fullName,
        studentEmail: app.student.email,
        studentId: app.student.studentId,
        clusterName: targetCluster?.name || "Unknown",
        clusterLocation: targetCluster?.location || "",
      });
    } else {
      await prisma.transferRequest.update({
        where: { id },
        data: { status: "rejected", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
      });
      await prisma.application.update({
        where: { id: app.id },
        data: { status: "allocated" },
      });

      const fromCluster = await prisma.cluster.findUnique({ where: { id: transfer.fromClusterId } });

      if (transfer.type === "reapplication") {
        const [cluster1, cluster2] = await Promise.all([
          prisma.cluster.findUnique({ where: { id: transfer.pref1New || transfer.fromClusterId } }),
          prisma.cluster.findUnique({ where: { id: transfer.pref2New || transfer.fromClusterId } }),
        ]);
        await sendReapplicationResultEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          status: "rejected",
          cluster1: cluster1?.name || "Unknown",
          cluster2: cluster2?.name || "Unknown",
          reason: notes || "No specific reason provided",
        });
      } else {
        await sendTransferRejectedEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          clusterName: fromCluster?.name || "Unknown",
          reason: notes || "No specific reason provided",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
