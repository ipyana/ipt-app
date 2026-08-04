import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { generateToken } from "@/lib/otp";
import { sendAccountActivationEmail } from "@/lib/email";

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

    const placeholder = "$2b$12$placeholderplaceholderplaceholderplaceholderplaceholderp";
    const admin = await prisma.admin.create({
      data: { username, email, phone: phone || null, password: placeholder, role: role || "admin", status: "pending" },
    });

    const token = await generateToken(email, "admin_activation");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
    const activationLink = `${baseUrl}/activate-account?token=${token}`;

    await sendAccountActivationEmail({ name: username, email, activationLink });

    return NextResponse.json({ ...admin, message: "Admin created. Activation email sent." }, { status: 201 });
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
    if (role) data.role = role;

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
