import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { studentId, fullName, email, password, programId } = parsed.data;

    const existing = await prisma.student.findFirst({
      where: { OR: [{ email }, { studentId }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Student already exists" }, { status: 409 });
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
