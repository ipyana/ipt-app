import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCoordinatorOrAbove } from "@/lib/auth";
import { sendStaffTransferResultEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireCoordinatorOrAbove();
    const requests = await prisma.staffTransferRequest.findMany({
      include: {
        staff: { select: { id: true, name: true, email: true, department: true } },
        fromCluster: { select: { id: true, name: true } },
        toCluster: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(requests);
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

    const transfer = await prisma.staffTransferRequest.findUnique({
      where: { id },
      include: { staff: true, fromCluster: true, toCluster: true },
    });
    if (!transfer || transfer.status !== "pending") {
      return err("Transfer request not found or already processed", 400);
    }

    if (action === "approve") {
      await prisma.$transaction([
        prisma.staff.update({
          where: { id: transfer.staffId },
          data: { clusterId: transfer.toClusterId },
        }),
        prisma.staffTransferRequest.update({
          where: { id },
          data: { status: "approved", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
        }),
      ]);

      await sendStaffTransferResultEmail({
        name: transfer.staff.name,
        email: transfer.staff.email,
        status: "approved",
        fromCluster: transfer.fromCluster.name,
        toCluster: transfer.toCluster.name,
        reason: notes,
      });

      return NextResponse.json({ success: true, message: "Transfer approved" });
    }

    await prisma.staffTransferRequest.update({
      where: { id },
      data: { status: "rejected", reviewNotes: notes, reviewedById: admin.id, reviewedAt: new Date() },
    });

    await sendStaffTransferResultEmail({
      name: transfer.staff.name,
      email: transfer.staff.email,
      status: "rejected",
      fromCluster: transfer.fromCluster.name,
      toCluster: transfer.toCluster.name,
      reason: notes || "No reason provided",
    });

    return NextResponse.json({ success: true, message: "Transfer rejected" });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
