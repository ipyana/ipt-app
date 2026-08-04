import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { staffRegisterSchema } from "@/lib/validations";
import { generateToken } from "@/lib/otp";
import { sendAccountActivationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = staffRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, phone, department, clusterId } = parsed.data;

    const existing = await prisma.staff.findFirst({
      where: { OR: [{ email }, phone ? { phone } : {}] },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with that email or phone already exists" }, { status: 409 });
    }

    const placeholder = "$2b$12$placeholderplaceholderplaceholderplaceholderplaceholderp";
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: placeholder,
        role: "staff",
        isActive: false,
        status: "pending_activation",
        department,
        clusterId,
      },
    });

    try {
      const token = await generateToken(email, "staff_activation");
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
      const activationLink = `${baseUrl}/activate-account?token=${token}&email=${encodeURIComponent(email)}`;
      await sendAccountActivationEmail({ name: staff.name, email: staff.email, activationLink });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      status: "pending_activation",
      message: "Registration submitted. Check your email to activate your account.",
    }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Email or phone already exists" }, { status: 409 });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
