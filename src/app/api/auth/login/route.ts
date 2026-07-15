import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { identifier, password } = parsed.data;

    const student = await prisma.student.findFirst({
      where: { OR: [{ studentId: identifier }, { email: identifier }] },
    });

    if (student) {
      const valid = await bcrypt.compare(password, student.password);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

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
    }

    const admin = await prisma.admin.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });

    if (admin) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const token = await createToken({ id: admin.id, role: admin.role });

      const response = NextResponse.json({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
