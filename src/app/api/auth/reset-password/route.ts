import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/otp";
import { strongPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimit(clientKey(request, "reset-password"), 10);
    if (!limit.allowed) {
      return NextResponse.json({ error: `Too many attempts. Try again in ${limit.retryAfterSec} seconds.` }, { status: 429 });
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, token, newPassword } = parsed.data;
    const pwCheck = strongPasswordSchema.safeParse(newPassword);
    if (!pwCheck.success) {
      return NextResponse.json({ error: pwCheck.error.issues[0].message }, { status: 400 });
    }

    const valid = await verifyToken(email, token, "password_reset");
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
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
