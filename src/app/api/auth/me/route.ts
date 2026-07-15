import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "admin") {
      const admin = await prisma.admin.findUnique({ where: { id: session.id } });
      return NextResponse.json({
        id: admin?.id,
        username: admin?.username,
        email: admin?.email,
        role: "admin",
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: session.id },
      include: { applications: { include: { 
        // include names via raw lookup later if needed 
      } } },
    });

    if (!student) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      department: student.department,
      program: student.program,
      email: student.email,
      role: student.role,
      application: student.applications[0] || null,
    });
  } catch {
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 });
  }
}
