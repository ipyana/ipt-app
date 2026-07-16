import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const session = await requireAuth();
    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (!application || application.status !== "allocated") {
      return err("No active allocation", 400);
    }

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    const allClusters = await prisma.cluster.findMany({
      where: {
        id: { not: application.allocatedCluster! },
        allowedPrograms: {
          some: { program: { name: student.program } },
        },
      },
      include: {
        allowedPrograms: { where: { program: { name: student.program } } },
        staff: { select: { name: true } },
      },
    });

    const eligible = allClusters.filter((c) => {
      const cp = c.allowedPrograms[0];
      return cp && cp.enrolled < cp.slots;
    });

    return NextResponse.json(eligible);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
      include: { student: true, transferRequests: { where: { status: "pending" } } },
    });
    if (!application || application.status !== "allocated") {
      return err("No active allocation", 400);
    }
    if (application.transferRequests.length > 0) {
      return err("You already have a pending transfer request", 409);
    }

    const phase1 = await prisma.phase.findFirst({
      where: { session: { isActive: true }, phaseNumber: 1 },
    });
    if (!phase1) return err("No active IPT session", 400);

    const now = new Date();
    const windowEnd = new Date(phase1.startDate);
    windowEnd.setDate(windowEnd.getDate() + 7);
    if (now > windowEnd) {
      return err("Transfer window has closed (available only during the first week)", 403);
    }

    const { toClusterId, reason } = await request.json();
    if (!toClusterId || !reason || reason.trim().length < 10) {
      return err("Select a cluster and provide a reason (min 10 characters)", 400);
    }

    if (toClusterId === application.allocatedCluster) {
      return err("You are already allocated to that cluster", 400);
    }

    const cp = await prisma.clusterProgram.findFirst({
      where: { clusterId: toClusterId, program: { name: application.student.program } },
    });
    if (!cp) return err("Your program is not eligible for that cluster", 403);
    if (cp.enrolled >= cp.slots) return err("No available slots in that cluster", 409);

    const transfer = await prisma.transferRequest.create({
      data: {
        applicationId: application.id,
        fromClusterId: application.allocatedCluster!,
        toClusterId,
        reason,
        status: "pending",
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Transfer request failed", 500);
  }
}
