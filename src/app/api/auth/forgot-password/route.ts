import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, clientKey, checkEmailLimit, isEmailBlocked } from "@/lib/rateLimit";
import { forgotPasswordSchema } from "@/lib/validations";

const FORGOT_WINDOW_MS = 24 * 60 * 60 * 1000;
const FORGOT_MAX = 3;

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

    const blocked = await isEmailBlocked(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
    if (blocked.blocked) {
      return NextResponse.json(
        { error: `Too many reset requests for this email. You have been blocked for 24 hours. Try again in ${Math.ceil((blocked.retryAfterSec || 0) / 3600)} hour(s).` },
        { status: 429 }
      );
    }

    const student = await prisma.student.findUnique({ where: { email } });
    const staff = await prisma.staff.findUnique({ where: { email } });
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!student && !staff && !admin) {
      await checkEmailLimit(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
      return NextResponse.json({ error: "There is no record related to this email." }, { status: 404 });
    }

    if (student && student.status === "pending_activation") {
      await checkEmailLimit(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
      return NextResponse.json(
        { error: "Your account has not been activated. Visit your email and use the temporary password to activate." },
        { status: 403 }
      );
    }

    if (staff && (staff.status === "pending_activation" || staff.status === "pending_approval")) {
      await checkEmailLimit(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
      return NextResponse.json({ error: "Your account has not been fully activated yet." }, { status: 403 });
    }

    if (staff && staff.status === "rejected") {
      await checkEmailLimit(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
      return NextResponse.json({ error: "Your registration was not approved." }, { status: 403 });
    }

    let name = "";
    if (student) name = student.fullName;
    else if (staff) name = staff.name;
    else if (admin) {
      if (admin.role === "super_admin") {
        return NextResponse.json({ error: "Super admin password resets are handled separately" }, { status: 400 });
      }
      if (admin.status === "pending") {
        await checkEmailLimit(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
        return NextResponse.json({ error: "Your account has not been activated." }, { status: 403 });
      }
      name = admin.username;
    }

    await checkEmailLimit(email, "forgot", FORGOT_MAX, FORGOT_WINDOW_MS);
    const token = await generateToken(email, "password_reset");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const sent = await sendPasswordResetEmail({ name, email, resetLink });

    if (!sent) {
      return NextResponse.json(
        { error: "Unable to send the reset email. Please try again later or contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Password reset link sent to your email" });
  } catch {
    return NextResponse.json({ error: "Failed to send reset link" }, { status: 500 });
  }
}
