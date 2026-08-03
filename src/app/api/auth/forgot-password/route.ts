import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { email } });
    const staff = await prisma.staff.findUnique({ where: { email } });
    const admin = await prisma.admin.findUnique({ where: { email } });

    let name = "";
    if (student) name = student.fullName;
    else if (staff) name = staff.name;
    else if (admin) {
      if (admin.role === "super_admin") {
        return NextResponse.json({ error: "Super admin password resets are handled separately" }, { status: 400 });
      }
      name = admin.username;
    } else {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
    }

    const otpCode = await generateOtp(email, "password_reset");
    await sendPasswordResetEmail({ name, email, otpCode });

    return NextResponse.json({ success: true, message: "Password reset code sent to your email" });
  } catch {
    return NextResponse.json({ error: "Failed to send reset code" }, { status: 500 });
  }
}
