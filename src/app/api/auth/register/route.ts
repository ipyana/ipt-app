import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { generateTemporaryPassword } from "@/lib/password";
import { sendAccountCredentialsEmail } from "@/lib/email";
import { checkRateLimit, clientKey, checkEmailLimit, isEmailBlocked } from "@/lib/rateLimit";

const REGISTER_TRIAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const REGISTER_TRIAL_MAX = 3;
const TEMP_PASSWORD_TTL_MS = 8 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimit(clientKey(request, "register"), 5);
    if (!limit.allowed) {
      return NextResponse.json({ error: `Too many registration attempts. Try again in ${limit.retryAfterSec} seconds.` }, { status: 429 });
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { studentId, fullName, email, programId } = parsed.data;

    const blocked = await isEmailBlocked(email, "register", REGISTER_TRIAL_MAX, REGISTER_TRIAL_WINDOW_MS);
    if (blocked.blocked) {
      return NextResponse.json(
        { error: `Too many registration attempts for this email. You have been blocked for 24 hours. Try again in ${Math.ceil((blocked.retryAfterSec || 0) / 3600)} hour(s).` },
        { status: 429 }
      );
    }

    const [existingStudent, existingStaff, existingAdmin] = await Promise.all([
      prisma.student.findFirst({ where: { OR: [{ email }, { studentId }] } }),
      prisma.staff.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);
    if (existingStudent || existingStaff || existingAdmin) {
      await checkEmailLimit(email, "register", REGISTER_TRIAL_MAX, REGISTER_TRIAL_WINDOW_MS);
      let error: string;
      if (existingStudent?.status === "pending_activation") {
        error = "Same credentials have been used to create an account. Try to activate it using the temporary password sent to your email.";
      } else if (existingStudent) {
        error = "Same credentials have been used to create an account. Try to activate, or reset your password.";
      } else if (existingStaff || existingAdmin) {
        error = "User Already Exists. Contact your facilitator or Admin, or reset password.";
      } else {
        error = "User Already Exists. Contact your facilitator or Admin, or reset password.";
      }
      return NextResponse.json({ error, code: "USER_EXISTS" }, { status: 409 });
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { department: true },
    });
    if (!program) {
      return NextResponse.json({ error: "Invalid program selected" }, { status: 400 });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    const tempPasswordExpiresAt = new Date(Date.now() + TEMP_PASSWORD_TTL_MS);

    await prisma.student.create({
      data: {
        studentId,
        fullName,
        department: program.department.abbreviation,
        program: program.name,
        email,
        password: hashedPassword,
        role: "student",
        mustChangePassword: true,
        status: "pending_activation",
        temporaryPasswordExpiresAt: tempPasswordExpiresAt,
      },
    });

    try {
      await sendAccountCredentialsEmail({
        name: fullName,
        email,
        role: "student",
        temporaryPassword,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Check your email for your temporary password to activate your account (expires in 8 hours).",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
