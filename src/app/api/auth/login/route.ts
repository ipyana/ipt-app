import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { sendLoginNotificationEmail } from "@/lib/email";
import { parseUserAgent, getGeo } from "@/lib/useragent";

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "Unknown";
}

async function notifyLogin(name: string, email: string, request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent") || "";
    const info = parseUserAgent(ua);
    const ip = clientIp(request);
    const location = await getGeo(ip);
    await sendLoginNotificationEmail({
      name,
      email,
      browser: info.browser,
      os: info.os,
      device: info.device,
      location,
      ip,
    });
  } catch { /* non-blocking */ }
}

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

      void notifyLogin(student.fullName, student.email, request);

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
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

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

      void notifyLogin(staff.name, staff.email, request);

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
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

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

      void notifyLogin(admin.username, admin.email, request);

      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
