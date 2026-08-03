import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireAdmin();
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
    await requireAdmin();
    const body = await request.json();
    const { name, email, phone, password, clusterId } = body;
    if (!name || !email || !password || !clusterId) return err("Name, email, password, and cluster are required", 400);

    const hashed = await bcrypt.hash(password, 12);
    const staff = await prisma.staff.create({
      data: { name, email, phone: phone || null, password: hashed, role: "staff", clusterId },
      include: { cluster: { select: { id: true, name: true } } },
    });
    return NextResponse.json(staff, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    if (e.code === "P2002") return err("Email or phone already exists", 409);
    return err("Failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, email, phone, password, clusterId, isActive } = body;
    if (!id) return err("ID is required", 400);

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
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
    await requireAdmin();
    const body = await request.json();
    await prisma.staff.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
