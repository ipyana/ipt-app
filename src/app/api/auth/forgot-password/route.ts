import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimit(clientKey(request, "forgot-password"), 5);
    if (!limit.allowed) {
      return NextResponse.json({ error: `Too many reset requests. Try again in ${limit.retryAfterSec} seconds.` }, { status: 429 });
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email } = parsed.data;
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

    const token = await generateToken(email, "password_reset");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail({ name, email, resetLink });

    return NextResponse.json({ success: true, message: "Password reset link sent to your email" });
  } catch {
    return NextResponse.json({ error: "Failed to send reset link" }, { status: 500 });
  }
}
