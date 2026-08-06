import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { staffRegisterSchema } from "@/lib/validations";
import { generateTemporaryPassword } from "@/lib/password";
import { sendAccountCredentialsEmail } from "@/lib/email";
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

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "staff",
        isActive: false,
        status: "pending_approval",
        mustChangePassword: true,
        department,
        clusterId,
      },
    });

    try {
      await sendAccountCredentialsEmail({
        name: staff.name,
        email: staff.email,
        role: "facilitator",
        temporaryPassword,
        approvalNote: "Your registration is awaiting approval. You can sign in with this password once your account has been approved.",
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      status: "pending_approval",
      message: "Registration submitted. Check your email for your temporary password. You can sign in once your registration is approved.",
    }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "User Already Exists, Contact your facilitator or Admin, or reset password", code: "USER_EXISTS" }, { status: 409 });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
