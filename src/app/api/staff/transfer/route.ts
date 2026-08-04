import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const session = await requireStaff();
    const requests = await prisma.staffTransferRequest.findMany({
      where: { staffId: session.id },
      include: {
        fromCluster: { select: { id: true, name: true } },
        toCluster: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
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
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff) return err("Staff not found", 404);
    if (staff.status !== "active") return err("Account is not active", 403);
    if (!staff.clusterId) return err("You are not assigned to any cluster", 400);

    const { toClusterId, reason } = await request.json();
    if (!toClusterId) return err("Select a cluster", 400);
    if (toClusterId === staff.clusterId) return err("You are already assigned to that cluster", 400);
    if (!reason || reason.trim().length < 10) return err("Provide a reason (min 10 characters)", 400);

    const target = await prisma.cluster.findUnique({ where: { id: Number(toClusterId) } });
    if (!target) return err("Cluster not found", 404);

    const pending = await prisma.staffTransferRequest.findFirst({
      where: { staffId: staff.id, status: "pending" },
    });
    if (pending) return err("You already have a pending transfer request", 409);

    const created = await prisma.staffTransferRequest.create({
      data: {
        staffId: staff.id,
        fromClusterId: staff.clusterId,
        toClusterId: Number(toClusterId),
        reason: reason.trim(),
        status: "pending",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
