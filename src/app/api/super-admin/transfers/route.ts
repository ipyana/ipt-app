import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCoordinatorOrAbove } from "@/lib/auth";
import { sendTransferApprovedEmail, sendTransferRejectedEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireCoordinatorOrAbove();

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
      toClusterName: clusterMap[t.toClusterId] || "Unknown",
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
    const admin = await requireCoordinatorOrAbove();

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
      const cp = await prisma.clusterProgram.findFirst({
        where: { clusterId: transfer.toClusterId, program: { name: app.student.program } },
      });
      if (!cp || cp.enrolled >= cp.slots) {
        return err("No available slots in the target cluster", 409);
      }

      const oldCp = await prisma.clusterProgram.findFirst({
        where: { clusterId: transfer.fromClusterId, program: { name: app.student.program } },
      });

      await prisma.$transaction(async (tx) => {
        await tx.transferRequest.update({
          where: { id },
          data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
        });

        await tx.application.update({
          where: { id: app.id },
          data: { allocatedCluster: transfer.toClusterId },
        });

        if (oldCp) {
          await tx.clusterProgram.update({
            where: { clusterId_programId: { clusterId: transfer.fromClusterId, programId: oldCp.programId } },
            data: { enrolled: { decrement: 1 } },
          });
          await tx.cluster.update({
            where: { id: transfer.fromClusterId },
            data: { currentEnrolled: { decrement: 1 } },
          });
        }

        await tx.clusterProgram.update({
          where: { clusterId_programId: { clusterId: transfer.toClusterId, programId: cp.programId } },
          data: { enrolled: { increment: 1 } },
        });
        await tx.cluster.update({
          where: { id: transfer.toClusterId },
          data: { currentEnrolled: { increment: 1 } },
        });

        const phases = await tx.phase.findMany({
          where: { session: { isActive: true }, clusterId: { in: [transfer.fromClusterId, transfer.toClusterId] } },
        });

        for (const alloc of app.allocations) {
          const ph = phases.find((p) => p.id === alloc.phaseId);
          if (ph) {
            await tx.phaseAllocation.update({
              where: { id: alloc.id },
              data: { clusterId: transfer.toClusterId, phaseId: ph.id },
            });
          }
        }
      });

      const targetCluster = await prisma.cluster.findUnique({ where: { id: transfer.toClusterId } });

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

      const fromCluster = await prisma.cluster.findUnique({ where: { id: transfer.fromClusterId } });

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
