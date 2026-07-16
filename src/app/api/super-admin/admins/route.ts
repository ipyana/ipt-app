import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await requireSuperAdmin();
    const admins = await prisma.admin.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(admins);
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
    const { username, email, password, role } = body;
    if (!username || !email || !password) return err("Username, email, and password are required", 400);

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { username, email, password: hashed, role: role || "admin" },
    });
    return NextResponse.json(admin, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    if (e.code === "P2002") return err("Username or email already exists", 409);
    return err("Failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { id, username, email, password, role } = body;
    if (!id) return err("ID is required", 400);

    const data: any = {};
    if (username) data.username = username;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.update({ where: { id }, data });
    return NextResponse.json(admin);
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
    const target = await prisma.admin.findUnique({ where: { id: body.id } });
    if (!target) return err("Not found", 404);
    if (target.role === "super_admin") return err("Cannot delete super admin", 400);
    await prisma.admin.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
