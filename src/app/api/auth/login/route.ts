import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, clientKey, isEmailBlocked, recordEmailAttempt, clearEmailLimit } from "@/lib/rateLimit";

const LOGIN_TRIAL_WINDOW_MS = 6 * 60 * 60 * 1000;
const LOGIN_TRIAL_MAX = 3;

export async function POST(request: NextRequest) {
  try {
    const ipKey = clientKey(request, "login");
    const limit = await checkRateLimit(ipKey, 10);
    if (!limit.allowed) {
      return NextResponse.json({ error: `Too many login attempts. Try again in ${limit.retryAfterSec} seconds.` }, { status: 429 });
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { identifier, password } = parsed.data;

    const blocked = await isEmailBlocked(identifier, "login", LOGIN_TRIAL_MAX, LOGIN_TRIAL_WINDOW_MS);
    if (blocked.blocked) {
      return NextResponse.json(
        { error: `Too many sign-in attempts. You have been blocked for 6 hours. Try again in ${Math.ceil((blocked.retryAfterSec || 0) / 3600)} hour(s).` },
        { status: 429 }
      );
    }

    const recordFailure = () => recordEmailAttempt(identifier, "login", LOGIN_TRIAL_WINDOW_MS);
    const clearFailure = () => clearEmailLimit(identifier, "login");

    const student = await prisma.student.findFirst({
      where: { OR: [{ studentId: identifier }, { email: identifier }] },
    });

    if (student) {
      if (student.mustChangePassword && student.temporaryPasswordExpiresAt && student.temporaryPasswordExpiresAt < new Date()) {
        return NextResponse.json({ error: "Your temporary password has expired. Please create a new account." }, { status: 403 });
      }

      const valid = await bcrypt.compare(password, student.password);
      if (!valid) {
        await recordFailure();
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      await clearFailure();

      const token = await createToken({ id: student.id, role: student.role, studentId: student.studentId });

      const response = NextResponse.json({
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        department: student.department,
        program: student.program,
        email: student.email,
        role: student.role,
        mustChangePassword: student.mustChangePassword,
        status: student.status,
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

    const staff = await prisma.staff.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (staff) {
      if (staff.status === "pending_activation") {
        return NextResponse.json({ error: "Your account is pending activation. Please check your email for the activation link." }, { status: 403 });
      }
      if (staff.status === "pending_approval") {
        return NextResponse.json({ error: "Your account is pending approval. Please wait for an administrator to review your registration." }, { status: 403 });
      }
      if (staff.status === "rejected") {
        return NextResponse.json({ error: "Your registration was not approved. Please contact the IPT coordinator." }, { status: 403 });
      }
      if (!staff.isActive) {
        return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
      }

      const valid = await bcrypt.compare(password, staff.password);
      if (!valid) {
        await recordFailure();
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      await clearFailure();

      const token = await createToken({ id: staff.id, role: staff.role });

      const response = NextResponse.json({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        clusterId: staff.clusterId,
        mustChangePassword: staff.mustChangePassword,
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
      where: { OR: [{ username: identifier }, { email: identifier }, { phone: identifier }] },
    });

    if (admin) {
      if (admin.role === "super_admin") {
        return NextResponse.json({ error: "Super admins must use the dedicated login API" }, { status: 401 });
      }
      if (admin.status === "pending") {
        return NextResponse.json({ error: "Your account is pending activation. Please check your email for the activation link." }, { status: 403 });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        await recordFailure();
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      await clearFailure();

      const token = await createToken({ id: admin.id, role: admin.role });

      const response = NextResponse.json({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
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

    await recordFailure();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
