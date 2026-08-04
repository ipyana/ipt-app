import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendStaffApprovedEmail, sendStaffRejectedEmail, sendAccountActivatedEmail, sendAccountActivationEmail } from "@/lib/email";
import { generateToken } from "@/lib/otp";
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
    const { name, email, phone, department, clusterId } = body;
    if (!name || !email || !clusterId) return err("Name, email, and cluster are required", 400);

    const placeholder = "$2b$12$placeholderplaceholderplaceholderplaceholderplaceholderp";
    const staff = await prisma.staff.create({
      data: { name, email, phone: phone || null, department: department || null, password: placeholder, role: "staff", clusterId, status: "pending_activation", isActive: false },
      include: { cluster: { select: { id: true, name: true } } },
    });

    try {
      const token = await generateToken(email, "staff_activation");
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
      const activationLink = `${baseUrl}/activate-account?token=${token}&email=${encodeURIComponent(email)}`;
      await sendAccountActivationEmail({ name: staff.name, email: staff.email, activationLink });
    } catch { /* non-blocking */ }

    return NextResponse.json({ ...staff, message: "Facilitator created. Activation email sent." }, { status: 201 });
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
    const { id, name, email, phone, department, password, clusterId, isActive, action, reason } = body;
    if (!id) return err("ID is required", 400);

    if (action === "approve") {
      const staff = await prisma.staff.update({
        where: { id },
        data: { status: "active", isActive: true },
        include: { cluster: { select: { id: true, name: true, location: true } } },
      });
      await sendAccountActivatedEmail({
        name: staff.name,
        email: staff.email,
        clusterName: staff.cluster?.name || "",
      });
      return NextResponse.json(staff);
    }

    if (action === "resend-activation") {
      const staff = await prisma.staff.findUnique({ where: { id }, include: { cluster: { select: { name: true } } } });
      if (!staff) return err("Not found", 404);
      if (staff.status === "active" && staff.isActive) return err("Account is already active", 400);
      const token = await generateToken(staff.email, "staff_activation");
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
      const activationLink = `${baseUrl}/activate-account?token=${token}&email=${encodeURIComponent(staff.email)}`;
      await sendAccountActivationEmail({ name: staff.name, email: staff.email, activationLink });
      return NextResponse.json({ ...staff, message: "Activation email resent" });
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
