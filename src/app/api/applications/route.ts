import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { applicationSchema } from "@/lib/validations";
import { sendSubmissionEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function tryAllocate(app: any, pref1: number, pref2: number, student: any) {
  const p1 = await prisma.clusterProgram.findFirst({
    where: { clusterId: pref1, program: { name: student.program } },
    include: { cluster: true },
  });
  const p2 = await prisma.clusterProgram.findFirst({
    where: { clusterId: pref2, program: { name: student.program } },
    include: { cluster: true },
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

  let allocateInPref1 = false;
  let allocateInPref2 = false;
  let usePref2AsPhase1 = false;

  if (p1.enrolled < p1.slots) {
    allocateInPref1 = true;
    allocateInPref2 = p2.enrolled < p2.slots;
    if (!allocateInPref2) {
      const p1b = await prisma.clusterProgram.findFirst({
        where: { clusterId: pref1, program: { name: student.program } },
      });
      if (p1b!.enrolled + 1 <= p1b!.slots) {
        allocateInPref2 = false;
      }
    }
  } else if (p2.enrolled < p2.slots) {
    allocateInPref2 = true;
    usePref2AsPhase1 = true;
    allocateInPref1 = p1.enrolled < p1.slots;
  }

  if (!allocateInPref1 && !allocateInPref2) return null;

  const result: any = { status: "allocated", allocatedCluster: usePref2AsPhase1 ? pref2 : pref1 };
  const allocationData: any[] = [];

  if (usePref2AsPhase1) {
    if (p2Phase1 && allocateInPref2) {
      allocationData.push({ phaseId: p2Phase1.id, clusterId: pref2 });
    }
    if (p1Phase2 && p1.enrolled < p1.slots) {
      allocationData.push({ phaseId: p1Phase2.id, clusterId: pref1 });
    }
  } else {
    if (p1Phase1 && allocateInPref1) {
      allocationData.push({ phaseId: p1Phase1.id, clusterId: pref1 });
    }
    if (p2Phase2 && allocateInPref2) {
      allocationData.push({ phaseId: p2Phase2.id, clusterId: pref2 });
    }
  }

  return { result, allocationData, p1, p2, usePref2AsPhase1 };
}

export async function GET() {
  try {
    const session = await requireAuth();
    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
      include: {
        student: { select: { fullName: true, department: true, program: true } },
        allocations: { include: { phase: true } },
        waitlistEntries: true,
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

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [pref1, pref2] } },
      include: {
        allowedPrograms: { include: { program: true } },
      },
    });

    if (clusters.length !== 2) return err("One or more selected clusters do not exist", 400);

    for (const cluster of clusters) {
      const cp = cluster.allowedPrograms.find(
        (ap) => ap.program.name === student.program
      );
      if (!cp) {
        return err(`Your program (${student.program}) does not have slots in "${cluster.name}"`, 403);
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
      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: app.id },
          data: { status: "allocated", allocatedCluster: allocation.result.allocatedCluster },
        });

        for (const ad of allocation.allocationData) {
          await tx.phaseAllocation.create({
            data: { phaseId: ad.phaseId, applicationId: app.id, clusterId: ad.clusterId },
          });
        }

        await tx.clusterProgram.update({
          where: { clusterId_programId: { clusterId: allocation.p1.clusterId, programId: allocation.p1.programId } },
          data: { enrolled: { increment: 1 } },
        });
        await tx.cluster.update({
          where: { id: allocation.p1.clusterId },
          data: { currentEnrolled: { increment: 1 } },
        });
      });

      const full = await prisma.application.findUnique({
        where: { id: app.id },
        include: { allocations: { include: { phase: true } } },
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

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [pref1, pref2] } },
      include: {
        allowedPrograms: { include: { program: true } },
      },
    });

    if (clusters.length !== 2) return err("Invalid cluster selection", 400);

    for (const cluster of clusters) {
      const cp = cluster.allowedPrograms.find(
        (ap) => ap.program.name === student.program
      );
      if (!cp) {
        return err(`Your program (${student.program}) is not eligible for "${cluster.name}"`, 403);
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
      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: updated.id },
          data: { status: "allocated", allocatedCluster: allocation.result.allocatedCluster },
        });

        for (const ad of allocation.allocationData) {
          await tx.phaseAllocation.create({
            data: { phaseId: ad.phaseId, applicationId: updated.id, clusterId: ad.clusterId },
          });
        }

        await tx.clusterProgram.update({
          where: { clusterId_programId: { clusterId: allocation.p1.clusterId, programId: allocation.p1.programId } },
          data: { enrolled: { increment: 1 } },
        });
        await tx.cluster.update({
          where: { id: allocation.p1.clusterId },
          data: { currentEnrolled: { increment: 1 } },
        });
      });

      const full = await prisma.application.findUnique({
        where: { id: updated.id },
        include: { allocations: { include: { phase: true } } },
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
