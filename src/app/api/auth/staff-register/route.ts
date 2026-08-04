import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { staffRegisterSchema } from "@/lib/validations";
import { generateToken } from "@/lib/otp";
import { sendAccountActivationEmail } from "@/lib/email";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimit(clientKey(request, "staff-register"), 5);
    if (!limit.allowed) {
      return NextResponse.json({ error: `Too many registration attempts. Try again in ${limit.retryAfterSec} seconds.` }, { status: 429 });
    }

    const body = await request.json();
    const parsed = staffRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, phone, department, clusterId } = parsed.data;

    const [existingStaff, existingStudent, existingAdmin] = await Promise.all([
      prisma.staff.findFirst({ where: { OR: [{ email }, phone ? { phone } : {}] } }),
      prisma.student.findFirst({ where: { email } }),
      prisma.admin.findFirst({ where: { OR: [{ email }, phone ? { phone } : {}] } }),
    ]);
    if (existingStaff || existingStudent || existingAdmin) {
      return NextResponse.json({ error: "User Already Exists, Contact your facilitator or Admin, or reset password", code: "USER_EXISTS" }, { status: 409 });
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
    if (e.code === "P2002") return NextResponse.json({ error: "User Already Exists, Contact your facilitator or Admin, or reset password", code: "USER_EXISTS" }, { status: 409 });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
