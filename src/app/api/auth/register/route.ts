import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { generateTemporaryPassword } from "@/lib/password";
import { sendAccountCredentialsEmail } from "@/lib/email";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";

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

    const [existingStudent, existingStaff, existingAdmin] = await Promise.all([
      prisma.student.findFirst({ where: { OR: [{ email }, { studentId }] } }),
      prisma.staff.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);
    if (existingStudent || existingStaff || existingAdmin) {
      return NextResponse.json({ error: "User Already Exists, Contact your facilitator or Admin, or reset password", code: "USER_EXISTS" }, { status: 409 });
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
      message: "Registration successful. Check your email for your temporary password to sign in.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
