import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { strongPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }
    const pwCheck = strongPasswordSchema.safeParse(newPassword);
    if (!pwCheck.success) {
      return NextResponse.json({ error: pwCheck.error.issues[0].message }, { status: 400 });
    }

    const valid = await verifyOtp(email, code, "password_reset");
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
      await prisma.student.update({ where: { id: student.id }, data: { password: hashed } });
      return NextResponse.json({ success: true });
    }

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (staff) {
      await prisma.staff.update({ where: { id: staff.id }, data: { password: hashed, mustChangePassword: false } });
      return NextResponse.json({ success: true });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin && admin.role !== "super_admin") {
      await prisma.admin.update({ where: { id: admin.id }, data: { password: hashed, mustChangePassword: false } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
