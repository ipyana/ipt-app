import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { applicationSchema } from "@/lib/validations";
import { sendSubmissionEmail } from "@/lib/email";
import { assignGroup } from "@/lib/groups";
import { reservePhaseSlot } from "@/lib/allocate";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Phase-aware allocation:
 *  - Phase 1 uses pref1 (its `enrolled` counter vs slots)
 *  - Phase 2 uses pref2 (its `phase2Enrolled` counter vs slots)
 * Falls back to swapping (pref2 for phase 1) only when pref1 is full.
 * Returns the phase-1/phase-2 cluster+department to reserve slots for, or null.
 */
async function tryAllocate(app: any, pref1: number, pref2: number, student: any) {
  const p1 = await prisma.clusterDepartment.findFirst({
    where: { clusterId: pref1, department: { abbreviation: student.department } },
    include: { cluster: true, department: true },
  });
  const p2 = await prisma.clusterDepartment.findFirst({
    where: { clusterId: pref2, department: { abbreviation: student.department } },
    include: { cluster: true, department: true },
  });
  if (!p1 || !p2) return null;

  const phases = await prisma.phase.findMany({
    where: { session: { isActive: true }, clusterId: { in: [pref1, pref2] } },
    orderBy: { phaseNumber: "asc" },
  });
  if (phases.length < 4) return null;

  const p1Phase1 = phases.find((ph) => ph.clusterId === pref1 && ph.phaseNumber === 1);
  const p1Phase2 = phases.find((ph) => ph.clusterId === pref1 && ph.phaseNumber === 2);
  const p2Phase1 = phases.find((ph) => ph.clusterId === pref2 && ph.phaseNumber === 1);
  const p2Phase2 = phases.find((ph) => ph.clusterId === pref2 && ph.phaseNumber === 2);

  // Phase-1 capacity = `enrolled`; phase-2 capacity = `phase2Enrolled`.
  const p1HasPhase1 = p1.enrolled < p1.slots;
  const p2HasPhase2 = p2.phase2Enrolled < p2.slots;
  const p2HasPhase1 = p2.enrolled < p2.slots;
  const p1HasPhase2 = p1.phase2Enrolled < p1.slots;

  let allocateInPref1 = false;
  let allocateInPref2 = false;
  let usePref2AsPhase1 = false;

  if (p1HasPhase1) {
    allocateInPref1 = true;
    allocateInPref2 = p2HasPhase2;
  } else if (p2HasPhase1) {
    allocateInPref2 = true;
    usePref2AsPhase1 = true;
    allocateInPref1 = p1HasPhase2;
  }

  if (!allocateInPref1 && !allocateInPref2) return null;

  const result: any = { status: "allocated", allocatedCluster: usePref2AsPhase1 ? pref2 : pref1 };
  const allocationData: any[] = [];
  let phase1ClusterId: number | null = null;
  let phase1DepartmentId: number | null = null;
  let phase2ClusterId: number | null = null;
  let phase2DepartmentId: number | null = null;

  if (usePref2AsPhase1) {
    if (p2Phase1 && allocateInPref2) {
      allocationData.push({ phaseId: p2Phase1.id, clusterId: pref2 });
      phase1ClusterId = pref2;
      phase1DepartmentId = p2.departmentId;
    }
    if (p1Phase2 && p1HasPhase2) {
      allocationData.push({ phaseId: p1Phase2.id, clusterId: pref1 });
      phase2ClusterId = pref1;
      phase2DepartmentId = p1.departmentId;
    }
  } else {
    if (p1Phase1 && allocateInPref1) {
      allocationData.push({ phaseId: p1Phase1.id, clusterId: pref1 });
      phase1ClusterId = pref1;
      phase1DepartmentId = p1.departmentId;
    }
    if (p2Phase2 && allocateInPref2) {
      allocationData.push({ phaseId: p2Phase2.id, clusterId: pref2 });
      phase2ClusterId = pref2;
      phase2DepartmentId = p2.departmentId;
    }
  }

  const p1ClusterId = usePref2AsPhase1 ? pref2 : pref1;
  const p1DepartmentId = (usePref2AsPhase1 ? p2 : p1).departmentId;

  return {
    result,
    allocationData,
    p1,
    p2,
    usePref2AsPhase1,
    p1ClusterId,
    p1DepartmentId,
    phase1ClusterId,
    phase1DepartmentId,
    phase2ClusterId,
    phase2DepartmentId,
  };
}

/** Reserve slots for both phases inside a transaction; throws when full so it rolls back. */
async function reserveAllocationSlots(
  tx: any,
  allocation: any,
  appId: number,
  groupAssignments: Record<number, number | null>
) {
  for (const ph of allocation.allocationData) {
    await tx.phaseAllocation.create({
      data: { phaseId: ph.phaseId, applicationId: appId, clusterId: ph.clusterId, groupId: groupAssignments[ph.phaseId] },
    });
  }

  const phase1Ok = allocation.phase1ClusterId && allocation.phase1DepartmentId
    ? await reservePhaseSlot(tx, allocation.phase1ClusterId, allocation.phase1DepartmentId, 1)
    : true;
  const phase2Ok = allocation.phase2ClusterId && allocation.phase2DepartmentId
    ? await reservePhaseSlot(tx, allocation.phase2ClusterId, allocation.phase2DepartmentId, 2)
    : true;

  if (!phase1Ok || !phase2Ok) {
    throw new Error("Slot no longer available");
  }
}

export async function GET() {
  try {
    const session = await requireAuth();
    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
      include: {
        student: { select: { fullName: true, department: true, program: true } },
        allocations: { include: { phase: true, group: { include: { venue: true } } } },
        waitlistEntries: true,
        transferRequests: { orderBy: { createdAt: "desc" } },
      },
    });
    return NextResponse.json(application);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const existing = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (existing) return err("Application already submitted", 409);

    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 400);

    const { pref1, pref2 } = parsed.data;

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    // A student who submits an application has clearly activated their account.
    if (student.status !== "active") {
      await prisma.student.update({ where: { id: student.id }, data: { status: "active" } });
    }

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [pref1, pref2] } },
      include: {
        allowedDepartments: { include: { department: true } },
        staff: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (clusters.length !== 2) return err("One or more selected clusters do not exist", 400);

    for (const cluster of clusters) {
      const cd = cluster.allowedDepartments?.find(
        (ad) => ad.department?.abbreviation === student.department
      );
      if (!cd) {
        return err(`Your department (${student.department}) has no slots in "${cluster.name}"`, 403);
      }
    }

    const app = await prisma.application.create({
      data: {
        studentId: session.id,
        clusterPref1: pref1,
        clusterPref2: pref2,
        status: "pending",
      },
    });

    const allocation = await tryAllocate(app, pref1, pref2, student);

    if (allocation) {
      const groupAssignments: Record<number, number | null> = {};
      for (const ph of allocation.allocationData) {
        groupAssignments[ph.phaseId] = await assignGroup(ph.clusterId, ph.phaseId);
      }

      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: app.id },
          data: { status: "allocated", allocatedCluster: allocation.result.allocatedCluster },
        });

        await reserveAllocationSlots(tx, allocation, app.id, groupAssignments);
      });

      const full = await prisma.application.findUnique({
        where: { id: app.id },
        include: { allocations: { include: { phase: true, group: { include: { venue: true } } } } },
      });

      await sendSubmissionEmail({
        studentName: student.fullName,
        studentEmail: student.email,
        studentId: student.studentId,
        clusterPref1: pref1,
        clusterPref2: pref2,
        clusters,
        allocations: full?.allocations || [],
        phases: await prisma.phase.findMany({
          where: { session: { isActive: true } },
          include: { cluster: { include: { staff: true } } },
        }),
      });

      return NextResponse.json({ ...full, autoAllocated: true }, { status: 201 });
    }

    const lastPos = await prisma.waitlistEntry.count({
      where: { clusterId: { in: [pref1, pref2] } },
    });

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: app.id },
        data: { status: "waitlisted", waitlistedAt: new Date() },
      });
      await tx.waitlistEntry.create({
        data: { applicationId: app.id, clusterId: pref1, position: lastPos + 1 },
      });
      await tx.waitlistEntry.create({
        data: { applicationId: app.id, clusterId: pref2, position: lastPos + 2 },
      });
    });

    return NextResponse.json({ ...app, status: "waitlisted", autoAllocated: false }, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Submission failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 400);

    const { pref1, pref2 } = parsed.data;

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (!application) return err("No application found", 404);
    if (application.status !== "pending" && application.status !== "waitlisted") {
      return err("Application already processed", 400);
    }

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    // A student who submits an application has clearly activated their account.
    if (student.status !== "active") {
      await prisma.student.update({ where: { id: student.id }, data: { status: "active" } });
    }

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [pref1, pref2] } },
      include: {
        allowedDepartments: { include: { department: true } },
        staff: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (clusters.length !== 2) return err("Invalid cluster selection", 400);

    for (const cluster of clusters) {
      const cd = cluster.allowedDepartments?.find(
        (ad) => ad.department?.abbreviation === student.department
      );
      if (!cd) {
        return err(`Your department (${student.department}) has no slots in "${cluster.name}"`, 403);
      }
    }

    await prisma.waitlistEntry.deleteMany({ where: { applicationId: application.id } });

    const updated = await prisma.application.update({
      where: { studentId: session.id },
      data: { clusterPref1: pref1, clusterPref2: pref2, status: "pending", waitlistedAt: null },
      include: { student: { select: { fullName: true, department: true, program: true } } },
    });

    const allocation = await tryAllocate(updated, pref1, pref2, student);

    if (allocation) {
      const groupAssignments: Record<number, number | null> = {};
      for (const ph of allocation.allocationData) {
        groupAssignments[ph.phaseId] = await assignGroup(ph.clusterId, ph.phaseId);
      }

      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: updated.id },
          data: { status: "allocated", allocatedCluster: allocation.result.allocatedCluster },
        });

        await reserveAllocationSlots(tx, allocation, updated.id, groupAssignments);
      });

      const full = await prisma.application.findUnique({
        where: { id: updated.id },
        include: { allocations: { include: { phase: true, group: { include: { venue: true } } } } },
      });

      await sendSubmissionEmail({
        studentName: student.fullName,
        studentEmail: student.email,
        studentId: student.studentId,
        clusterPref1: pref1,
        clusterPref2: pref2,
        clusters,
        allocations: full?.allocations || [],
        phases: await prisma.phase.findMany({
          where: { session: { isActive: true } },
          include: { cluster: { include: { staff: true } } },
        }),
      });

      return NextResponse.json({ ...full, autoAllocated: true });
    }

    const lastPos = await prisma.waitlistEntry.count({
      where: { clusterId: { in: [pref1, pref2] } },
    });

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: updated.id },
        data: { status: "waitlisted", waitlistedAt: new Date() },
      });
      await tx.waitlistEntry.create({
        data: { applicationId: updated.id, clusterId: pref1, position: lastPos + 1 },
      });
      await tx.waitlistEntry.create({
        data: { applicationId: updated.id, clusterId: pref2, position: lastPos + 2 },
      });
    });

    return NextResponse.json({ ...updated, status: "waitlisted", autoAllocated: false });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Update failed", 500);
  }
}
