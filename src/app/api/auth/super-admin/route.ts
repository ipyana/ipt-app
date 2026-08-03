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

    const admin = await prisma.admin.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }, { phone: identifier }] },
    });

    if (!admin || admin.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: super admin access only" }, { status: 403 });
    }

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
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
