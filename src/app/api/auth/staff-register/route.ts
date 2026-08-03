import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, clusterId } = body;

    if (!name || !email || !password || !clusterId) {
      return NextResponse.json({ error: "Name, email, password, and cluster are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.staff.findFirst({
      where: { OR: [{ email }, phone ? { phone } : {}] },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with that email or phone already exists" }, { status: 409 });
    }

    const cluster = await prisma.cluster.findUnique({ where: { id: clusterId } });
    if (!cluster) {
      return NextResponse.json({ error: "Invalid cluster selected" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashed,
        role: "staff",
        isActive: false,
        status: "pending_approval",
        clusterId,
      },
    });

    return NextResponse.json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      status: "pending_approval",
      message: "Registration submitted for approval",
    }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Email or phone already exists" }, { status: 409 });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
