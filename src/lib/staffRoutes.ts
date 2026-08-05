import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendStaffRejectedEmail, sendAccountActivatedEmail, sendAccountActivationEmail } from "@/lib/email";
import { generateToken } from "@/lib/otp";
import bcrypt from "bcryptjs";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type Guard = () => Promise<any>;

export function createStaffRoute(guard: Guard, deleteGuard: Guard) {
  async function GET() {
    try {
      await guard();
      const staff = await prisma.staff.findMany({
        include: { cluster: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(staff);
    } catch (e: any) {
      return handleErr(e);
    }
  }

  async function POST(request: NextRequest) {
    try {
      await guard();
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
      if (e.code === "P2002") return err("That email or phone already exists", 409);
      return handleErr(e);
    }
  }

  async function PUT(request: NextRequest) {
    try {
      await guard();
      const body = await request.json();
      const { id, name, email, phone, department, password, clusterId, isActive, action, reason, temporaryPassword } = body;
      if (!id) return err("ID is required", 400);

      if (action === "approve") {
        const staff = await prisma.staff.findUnique({ where: { id } });
        if (!staff) return err("Not found", 404);
        if (!["pending_activation", "pending_approval", "rejected"].includes(staff.status)) {
          return err("This facilitator cannot be approved in their current state", 400);
        }
        const hasRealPassword = staff.password && !staff.password.includes("placeholder");
        const tempPassword = temporaryPassword?.trim();
        if (!hasRealPassword && (!tempPassword || tempPassword.length < 6)) {
          return err("This facilitator has not set a password. Set a temporary password (min 6 characters) so they can sign in.", 400);
        }
        const data: any = { status: "active", isActive: true };
        if (tempPassword) {
          data.password = await bcrypt.hash(tempPassword, 12);
          data.mustChangePassword = true;
        }
        const updated = await prisma.staff.update({
          where: { id },
          data,
          include: { cluster: { select: { id: true, name: true, location: true } } },
        });
        await sendAccountActivatedEmail({
          name: updated.name,
          email: updated.email,
          clusterName: updated.cluster?.name || "",
          temporaryPassword: tempPassword || undefined,
        });
        return NextResponse.json(updated);
      }

      if (action === "force-activate") {
        const staff = await prisma.staff.findUnique({ where: { id } });
        if (!staff) return err("Not found", 404);
        const updated = await prisma.staff.update({
          where: { id },
          data: { status: "pending_activation", isActive: false, mustChangePassword: true },
          include: { cluster: { select: { id: true, name: true } } },
        });
        const token = await generateToken(staff.email, "staff_activation");
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
        const activationLink = `${baseUrl}/activate-account?token=${token}&email=${encodeURIComponent(staff.email)}`;
        await sendAccountActivationEmail({ name: staff.name, email: staff.email, activationLink });
        return NextResponse.json({ ...updated, message: "Activation email resent. Facilitator must set a password before approval." });
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
      return handleErr(e);
    }
  }

  async function DELETE(request: NextRequest) {
    try {
      await deleteGuard();
      const body = await request.json();
      await prisma.staff.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true });
    } catch (e: any) {
      return handleErr(e);
    }
  }

  return { GET, POST, PUT, DELETE };
}

function handleErr(e: any) {
  if (e.message === "Unauthorized") return err("Unauthorized", 401);
  if (e.message === "Forbidden") return err("Forbidden", 403);
  return err("Failed", 500);
}
