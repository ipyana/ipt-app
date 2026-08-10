import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendTransferApprovedEmail, sendTransferRejectedEmail, sendReapplicationResultEmail } from "@/lib/email";
import { assignGroup } from "@/lib/groups";
import { reservePhaseSlot, releasePhaseSlot, getStudentDepartmentSlot } from "@/lib/allocate";

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
    const dept = app.student.department;

    // Which phase is being replaced for a single-cluster transfer?
    // replaceClusterId records the cluster the student chose to swap; when absent
    // (older requests) we default to the phase-1 (first) cluster = fromClusterId.
    const replaceClusterId = transfer.replaceClusterId ?? transfer.fromClusterId;
    const swapIsPhase2 = app.clusterPref2 === replaceClusterId;

    if (action === "approve") {
      if (transfer.type === "reapplication") {
        const newPref1 = transfer.pref1New!;
        const newPref2 = transfer.pref2New!;

        const cd1 = await getStudentDepartmentSlot(newPref1, dept);
        const cd2 = await getStudentDepartmentSlot(newPref2, dept);
        if (!cd1 || !cd2 || cd1.enrolled >= cd1.slots || cd2.phase2Enrolled >= cd2.slots) {
          return err("No available slots in one or both target clusters", 409);
        }

        const oldCd1 = await getStudentDepartmentSlot(app.clusterPref1, dept);
        const oldCd2 = await getStudentDepartmentSlot(app.clusterPref2, dept);

        await prisma.$transaction(async (tx) => {
          await tx.transferRequest.update({
            where: { id },
            data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
          });
          await tx.application.update({
            where: { id: app.id },
            data: { status: "allocated", clusterPref1: newPref1, clusterPref2: newPref2, allocatedCluster: newPref1 },
          });

          if (oldCd1) await releasePhaseSlot(tx, app.clusterPref1, oldCd1.departmentId, 1);
          if (oldCd2) await releasePhaseSlot(tx, app.clusterPref2, oldCd2.departmentId, 2);

          const p1 = await reservePhaseSlot(tx, newPref1, cd1.departmentId, 1);
          const p2 = await reservePhaseSlot(tx, newPref2, cd2.departmentId, 2);
          if (!p1 || !p2) throw new Error("Slot no longer available");

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
          prisma.cluster.findUnique({
            where: { id: newPref1 },
            include: { staff: { select: { id: true, name: true, phone: true, email: true } } },
          }),
          prisma.cluster.findUnique({
            where: { id: newPref2 },
            include: { staff: { select: { id: true, name: true, phone: true, email: true } } },
          }),
        ]);
        const newAllocs = await prisma.phaseAllocation.findMany({
          where: { applicationId: app.id },
          include: { phase: true, group: true },
        });
        const g1 = newAllocs.find((a) => a.phase?.clusterId === newPref1 && a.phase?.phaseNumber === 1)?.group;
        const g2 = newAllocs.find((a) => a.phase?.clusterId === newPref2 && a.phase?.phaseNumber === 2)?.group;
        await sendReapplicationResultEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          status: "approved",
          cluster1: cluster1?.name || "Unknown",
          cluster2: cluster2?.name || "Unknown",
          cluster1Location: cluster1?.location || "",
          cluster2Location: cluster2?.location || "",
          group1: g1?.name || "",
          group2: g2?.name || "",
          facilitators1: cluster1?.staff || [],
          facilitators2: cluster2?.staff || [],
        });

        return NextResponse.json({ success: true, message: "Reapplication approved" });
      }

      // Transfer changing BOTH clusters (pref1New + pref2New)
      if (transfer.pref1New && transfer.pref2New) {
        const newPref1 = transfer.pref1New;
        const newPref2 = transfer.pref2New;

        const cd1 = await getStudentDepartmentSlot(newPref1, dept);
        const cd2 = await getStudentDepartmentSlot(newPref2, dept);
        if (!cd1 || !cd2 || cd1.enrolled >= cd1.slots || cd2.phase2Enrolled >= cd2.slots) {
          return err("No available slots in one or both target clusters", 409);
        }

        const oldPref1 = app.clusterPref1;
        const oldPref2 = app.clusterPref2;
        const oldCd1 = await getStudentDepartmentSlot(oldPref1, dept);
        const oldCd2 = await getStudentDepartmentSlot(oldPref2, dept);

        await prisma.$transaction(async (tx) => {
          await tx.transferRequest.update({
            where: { id },
            data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
          });
          await tx.application.update({
            where: { id: app.id },
            data: { status: "allocated", clusterPref1: newPref1, clusterPref2: newPref2, allocatedCluster: newPref1 },
          });

          if (oldCd1) await releasePhaseSlot(tx, oldPref1, oldCd1.departmentId, 1);
          if (oldCd2) await releasePhaseSlot(tx, oldPref2, oldCd2.departmentId, 2);

          const p1 = await reservePhaseSlot(tx, newPref1, cd1.departmentId, 1);
          const p2 = await reservePhaseSlot(tx, newPref2, cd2.departmentId, 2);
          if (!p1 || !p2) throw new Error("Slot no longer available");

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
          prisma.cluster.findUnique({
            where: { id: newPref1 },
            include: { staff: { select: { id: true, name: true, phone: true, email: true } } },
          }),
          prisma.cluster.findUnique({
            where: { id: newPref2 },
            include: { staff: { select: { id: true, name: true, phone: true, email: true } } },
          }),
        ]);
        const newAllocs = await prisma.phaseAllocation.findMany({
          where: { applicationId: app.id },
          include: { phase: true, group: true },
        });
        const g1 = newAllocs.find((a) => a.phase?.clusterId === newPref1 && a.phase?.phaseNumber === 1)?.group;
        const g2 = newAllocs.find((a) => a.phase?.clusterId === newPref2 && a.phase?.phaseNumber === 2)?.group;
        await sendTransferApprovedEmail({
          studentName: app.student.fullName,
          studentEmail: app.student.email,
          studentId: app.student.studentId,
          clusterName: cluster1?.name || "Unknown",
          clusterLocation: cluster1?.location || "",
          groupName: g1?.name || "",
          groupLocation: g1?.location || "",
          facilitators: cluster1?.staff || [],
        });

        return NextResponse.json({ success: true, message: "Transfer approved" });
      }

      // Single cluster transfer — move ONLY the intended phase (default phase 1).
      const toClusterId = transfer.toClusterId!;
      const cd = await getStudentDepartmentSlot(toClusterId, dept);
      if (!cd) return err("Your department is not eligible for that cluster", 403);
      if (swapIsPhase2 ? cd.phase2Enrolled >= cd.slots : cd.enrolled >= cd.slots) {
        return err("No available slots in the target cluster", 409);
      }

      const oldCd = await getStudentDepartmentSlot(replaceClusterId, dept);
      const newPref1 = swapIsPhase2 ? app.clusterPref1 : toClusterId;
      const newPref2 = swapIsPhase2 ? toClusterId : app.clusterPref2;

      await prisma.$transaction(async (tx) => {
        await tx.transferRequest.update({
          where: { id },
          data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
        });
        await tx.application.update({
          where: { id: app.id },
          data: {
            status: "allocated",
            allocatedCluster: newPref1,
            clusterPref1: newPref1,
            clusterPref2: newPref2,
          },
        });

        const replacedPhase = swapIsPhase2 ? 2 : 1;
        const targetPhase = swapIsPhase2 ? 2 : 1;
        if (oldCd) await releasePhaseSlot(tx, replaceClusterId, oldCd.departmentId, replacedPhase);
        const reserved = await reservePhaseSlot(tx, toClusterId, cd.departmentId, targetPhase);
        if (!reserved) throw new Error("Slot no longer available");

        // Find the allocation of the replaced phase and move it to the target cluster.
        const replacedAlloc = app.allocations.find((a: any) => {
          return a.clusterId === replaceClusterId;
        });
        if (replacedAlloc) {
          const phases = await tx.phase.findMany({
            where: { session: { isActive: true }, clusterId: { in: [replaceClusterId, toClusterId] } },
          });
          const origPhase = phases.find((p) => p.id === replacedAlloc.phaseId);
          const targetPhaseRow = phases.find(
            (p) => p.clusterId === toClusterId && p.phaseNumber === (origPhase?.phaseNumber ?? replacedPhase)
          );
          const gid = targetPhaseRow ? await assignGroup(toClusterId, targetPhaseRow.id) : null;
          await tx.phaseAllocation.update({
            where: { id: replacedAlloc.id },
            data: {
              clusterId: toClusterId,
              phaseId: targetPhaseRow ? targetPhaseRow.id : replacedAlloc.phaseId,
              groupId: gid,
            },
          });
        }
      });

      const targetCluster = await prisma.cluster.findUnique({
        where: { id: toClusterId },
        include: { staff: { select: { id: true, name: true, phone: true, email: true } } },
      });
      const newAllocs = await prisma.phaseAllocation.findMany({
        where: { applicationId: app.id },
        include: { group: true },
      });
      const newGroup = newAllocs.find((a) => a.group)?.group || null;
      await sendTransferApprovedEmail({
        studentName: app.student.fullName,
        studentEmail: app.student.email,
        studentId: app.student.studentId,
        clusterName: targetCluster?.name || "Unknown",
        clusterLocation: targetCluster?.location || "",
        groupName: newGroup?.name || "",
        groupLocation: newGroup?.location || "",
        facilitators: targetCluster?.staff || [],
      });

      return NextResponse.json({ success: true, message: "Transfer approved" });
    }

    // Reject — restore the student to their previous allocation (already intact).
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

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
