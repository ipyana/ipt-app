import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { sendAccountCreatedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { studentId, fullName, email, password, programId } = parsed.data;

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

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await prisma.student.create({
      data: {
        studentId,
        fullName,
        department: program.department.abbreviation,
        program: program.name,
        email,
        password: hashedPassword,
        role: "student",
      },
    });

    const token = await createToken({ id: student.id, role: student.role, studentId: student.studentId });

    try {
      await sendAccountCreatedEmail({ name: student.fullName, email: student.email, role: "student" });
    } catch { /* non-blocking */ }

    const response = NextResponse.json({
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      department: student.department,
      program: student.program,
      email: student.email,
      role: student.role,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
