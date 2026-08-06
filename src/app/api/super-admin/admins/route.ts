import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { generateTemporaryPassword } from "@/lib/password";
import { sendAccountCredentialsEmail } from "@/lib/email";

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
    const { username, email, phone, role } = body;
    if (!username || !email) return err("Username and email are required", 400);

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    const admin = await prisma.admin.create({
      data: { username, email, phone: phone || null, password: hashedPassword, role: role || "admin", status: "active", mustChangePassword: true },
    });

    await sendAccountCredentialsEmail({
      name: username,
      email,
      role: "administrator",
      temporaryPassword,
    });

    return NextResponse.json({ ...admin, password: undefined, message: "Admin created. Temporary password emailed." }, { status: 201 });
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
    const { id, username, email, phone, role } = body;
    if (!id) return err("ID is required", 400);

    const data: any = {};
    if (username) data.username = username;
    if (email) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (role) {
      if (role === "super_admin") return err("Cannot assign super_admin role", 400);
      data.role = role;
    }

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
