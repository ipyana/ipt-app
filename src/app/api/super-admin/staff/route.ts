import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { sendStaffApprovedEmail, sendStaffRejectedEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireSuperAdmin();
    const staff = await prisma.staff.findMany({
      include: { cluster: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(staff);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { name, email, phone, department, password, clusterId } = body;
    if (!name || !email || !password || !clusterId) return err("Name, email, password, and cluster are required", 400);

    const hashed = await bcrypt.hash(password, 12);
    const staff = await prisma.staff.create({
      data: { name, email, phone: phone || null, department: department || null, password: hashed, role: "staff", clusterId },
      include: { cluster: { select: { id: true, name: true } } },
    });
    return NextResponse.json(staff, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    if (e.code === "P2002") return err("Email already exists", 409);
    return err("Failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { id, name, email, phone, department, password, clusterId, isActive, action, reason } = body;
    if (!id) return err("ID is required", 400);

    if (action === "approve") {
      const staff = await prisma.staff.update({
        where: { id },
        data: { status: "active", isActive: true },
        include: { cluster: { select: { id: true, name: true, location: true } } },
      });
      await sendStaffApprovedEmail({
        name: staff.name,
        email: staff.email,
        clusterName: staff.cluster?.name || "",
        clusterLocation: staff.cluster?.location || "",
      });
      return NextResponse.json(staff);
    }

    if (action === "reject") {
      const staff = await prisma.staff.update({
        where: { id },
        data: { status: "rejected", isActive: false },
        include: { cluster: { select: { id: true, name: true } } },
      });
      await sendStaffRejectedEmail({ name: staff.name, email: staff.email, reason: reason || "Not specified" });
      return NextResponse.json(staff);
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (department !== undefined) data.department = department;
    if (password) data.password = await bcrypt.hash(password, 12);
    if (clusterId !== undefined) data.clusterId = clusterId;
    if (isActive !== undefined) data.isActive = isActive;

    const staff = await prisma.staff.update({
      where: { id },
      data,
      include: { cluster: { select: { id: true, name: true } } },
    });
    return NextResponse.json(staff);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    await prisma.staff.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
