import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/otp";
import { strongPasswordSchema } from "@/lib/validations";
import { sendAccountActivatedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword, confirmPassword } = await request.json();

    if (!email || !token || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Email, activation token, and password are required" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const pwCheck = strongPasswordSchema.safeParse(newPassword);
    if (!pwCheck.success) {
      return NextResponse.json({ error: pwCheck.error.issues[0].message }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    // Staff activation
    const staffValid = await verifyToken(email, token, "staff_activation").catch(() => false);
    if (staffValid) {
      const staff = await prisma.staff.findFirst({ where: { email } });
      if (!staff) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      if (staff.status === "active" && staff.isActive) {
        return NextResponse.json({ error: "Account is already active" }, { status: 400 });
      }
      await prisma.staff.update({
        where: { id: staff.id },
        data: { password: hashed, status: "pending_approval", mustChangePassword: false },
      });
      return NextResponse.json({ success: true, message: "Password set. Your registration will be activated after approval." });
    }

    // Admin activation
    const adminValid = await verifyToken(email, token, "admin_activation").catch(() => false);
    if (adminValid) {
      const admin = await prisma.admin.findFirst({ where: { email } });
      if (!admin) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      if (admin.status === "active") {
        return NextResponse.json({ error: "Account is already active" }, { status: 400 });
      }
      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: hashed, status: "active", mustChangePassword: false },
      });

      try {
        await sendAccountActivatedEmail({ name: admin.username, email: admin.email });
      } catch { /* non-blocking */ }

      return NextResponse.json({ success: true, message: "Account activated. You can now sign in." });
    }

    return NextResponse.json({ error: "Invalid or expired activation link" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}
