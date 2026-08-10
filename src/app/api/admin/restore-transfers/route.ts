import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { releasePhaseSlot, reservePhaseSlot, getStudentDepartmentSlot } from "@/lib/allocate";
import { sendSubmissionEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * One-time data repair for approved single-cluster transfers that (before the
 * phase-aware fix) moved BOTH phase allocations into the transfer target.
 *
 * Semantics chosen: every approved single-cluster transfer is treated as a
 * PHASE-1 transfer (matches the server's recorded fromClusterId = clusterPref1).
 *   - Phase 1 stays at the transfer target.
 *   - Phase 2 is restored to the student's original second preference.
 *   - cluster_pref_1 is set to the target so prefs match reality.
 *
 * Emails each corrected student their Phase 1 + Phase 2 placement.
 * Backs up all affected rows first. Only processes transfers that are still in
 * the broken state (both phase allocations in the target cluster).
 */
export async function GET() {
  try {
    await requireAdmin();
    const affected = await listAffected();
    return NextResponse.json({
      count: affected.length,
      students: affected.map((a) => ({
        applicationId: a.app.id,
        studentId: a.app.student.studentId,
        name: a.app.student.fullName,
        email: a.app.student.email,
        pref1: a.app.clusterPref1,
        pref2: a.app.clusterPref2,
        target: a.transfer.toClusterId,
      })),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const dryRun = body?.dryRun === true;

    const affected = await listAffected();
    const results: { applicationId: number; name: string; restored: boolean; error?: string }[] = [];

    for (const { app, transfer } of affected) {
      try {
        if (dryRun) {
          results.push({ applicationId: app.id, name: app.student.fullName, restored: true });
          continue;
        }

        await restoreApplication(app, transfer);
        results.push({ applicationId: app.id, name: app.student.fullName, restored: true });
      } catch (e: any) {
        results.push({ applicationId: app.id, name: app.student.fullName, restored: false, error: e?.message || "Failed" });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      count: results.length,
      restored: results.filter((r) => r.restored).length,
      failed: results.filter((r) => !r.restored).length,
      results,
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

async function listAffected() {
  const transfers = await prisma.transferRequest.findMany({
    where: { type: "transfer", status: "approved", toClusterId: { not: null }, pref1New: null },
    include: {
      application: {
        include: { student: true, allocations: { include: { phase: true } } },
      },
    },
    orderBy: { id: "asc" },
  });

  const affected = [];
  for (const transfer of transfers) {
    const app = transfer.application;
    if (!app || app.status !== "allocated") continue;
    if (app.allocatedCluster !== transfer.toClusterId) continue;

    // Broken state = phase-1 AND phase-2 allocations both in the target cluster.
    const ph1 = app.allocations.find((a: any) => a.phase?.phaseNumber === 1);
    const ph2 = app.allocations.find((a: any) => a.phase?.phaseNumber === 2);
    if (!ph1 || !ph2) continue;
    if (ph1.clusterId !== transfer.toClusterId || ph2.clusterId !== transfer.toClusterId) continue;

    affected.push({ transfer, app });
  }

  // De-duplicate by application (a student may have had multiple approved requests).
  const seen = new Set<number>();
  return affected.filter((a) => (seen.has(a.app.id) ? false : (seen.add(a.app.id), true)));
}

async function restoreApplication(app: any, transfer: any) {
  const target = transfer.toClusterId!;
  const dept = app.student.department;
  const pref2 = app.clusterPref2;
  const oldPref1 = app.clusterPref1;

  const ph2 = app.allocations.find((a: any) => a.phase?.phaseNumber === 2);
  if (!ph2 || ph2.clusterId !== target) throw new Error("Phase-2 allocation not in target cluster");

  // Log the pre-restore state for rollback reference.
  await prisma.setting.upsert({
    where: { key: `restore_transfer_backup_${app.id}` },
    update: {
      value: JSON.stringify({
        applicationId: app.id,
        clusterPref1: app.clusterPref1,
        clusterPref2: app.clusterPref2,
        allocatedCluster: app.allocatedCluster,
        phase2AllocationId: ph2.id,
        phase2Cluster: ph2.clusterId,
        phase2PhaseId: ph2.phaseId,
        phase2GroupId: ph2.groupId,
      }),
    },
    create: { key: `restore_transfer_backup_${app.id}`, value: JSON.stringify({
      applicationId: app.id,
      clusterPref1: app.clusterPref1,
      clusterPref2: app.clusterPref2,
      allocatedCluster: app.allocatedCluster,
      phase2AllocationId: ph2.id,
      phase2Cluster: ph2.clusterId,
      phase2PhaseId: ph2.phaseId,
      phase2GroupId: ph2.groupId,
    }) },
  });

  await prisma.$transaction(async (tx) => {
    // Release the wrongly-placed phase-2 slot in the target cluster.
    const targetCd = await getStudentDepartmentSlot(target, dept);
    if (targetCd) await releasePhaseSlot(tx, target, targetCd.departmentId, 2);

    // Reserve a phase-2 slot in the original second-preference cluster.
    const pref2Cd = await getStudentDepartmentSlot(pref2, dept);
    if (!pref2Cd) throw new Error(`No department slot for ${dept} in cluster ${pref2}`);
    let ok = await reservePhaseSlot(tx, pref2, pref2Cd.departmentId, 2);
    if (!ok) {
      // Our bug forced these students out of their original phase-2 cluster, so we
      // expand that cluster's capacity to accommodate them rather than leaving them stuck.
      await tx.clusterDepartment.update({
        where: { clusterId_departmentId: { clusterId: pref2, departmentId: pref2Cd.departmentId } },
        data: { slots: { increment: 1 } },
      });
      await tx.cluster.update({
        where: { id: pref2 },
        data: { capacity: { increment: 1 } },
      });
      ok = await reservePhaseSlot(tx, pref2, pref2Cd.departmentId, 2);
      if (!ok) throw new Error(`Cluster ${pref2} is full for phase 2 even after capacity increase`);
    }

    // Move the phase-2 allocation back to pref2, picking its phase-2 row + group.
    const pref2Phase = await tx.phase.findFirst({
      where: { clusterId: pref2, phaseNumber: 2, session: { isActive: true } },
    });
    if (!pref2Phase) throw new Error(`No phase-2 record for cluster ${pref2}`);

    const groups = await tx.group.findMany({ where: { clusterId: pref2, phaseId: pref2Phase.id } });
    const gid = groups.length ? groups[Math.floor(Math.random() * groups.length)].id : null;

    await tx.phaseAllocation.update({
      where: { id: ph2.id },
      data: { clusterId: pref2, phaseId: pref2Phase.id, groupId: gid },
    });

    // Align preferences: phase 1 is now the transfer target.
    await tx.application.update({
      where: { id: app.id },
      data: { clusterPref1: target, clusterPref2: pref2, allocatedCluster: target },
    });
  });

  // Emit corrected placement email.
  const clusters = await prisma.cluster.findMany({
    where: { id: { in: [target, pref2] } },
    include: {
      allowedDepartments: { include: { department: true } },
      staff: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
  const full = await prisma.application.findUnique({
    where: { id: app.id },
    include: { allocations: { include: { phase: true, group: { include: { venue: true } } } } },
  });
  const phases = await prisma.phase.findMany({
    where: { session: { isActive: true } },
    include: { cluster: { include: { staff: true } } },
  });
  await sendSubmissionEmail({
    studentName: app.student.fullName,
    studentEmail: app.student.email,
    studentId: app.student.studentId,
    clusterPref1: target,
    clusterPref2: pref2,
    clusters,
    allocations: full?.allocations || [],
    phases,
  });
}
