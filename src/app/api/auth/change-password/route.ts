import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { strongPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { newPassword } = await request.json();

    const pwCheck = strongPasswordSchema.safeParse(newPassword);
    if (!pwCheck.success) {
      return NextResponse.json({ error: pwCheck.error.issues[0].message }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    if (session.role === "staff") {
      await prisma.staff.update({
        where: { id: session.id },
        data: { password: hashed, mustChangePassword: false },
      });
    } else if (["admin", "super_admin", "coordinator"].includes(session.role)) {
      await prisma.admin.update({
        where: { id: session.id },
        data: { password: hashed, mustChangePassword: false },
      });
    } else {
      await prisma.student.update({
        where: { id: session.id },
        data: { password: hashed, mustChangePassword: false },
      });
    }

    return NextResponse.json({ success: true, message: "Password changed" });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
