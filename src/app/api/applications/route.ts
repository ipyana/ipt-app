import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { applicationSchema } from "@/lib/validations";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const session = await requireAuth();
    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
      include: {
        student: { select: { fullName: true, department: true, program: true } },
      },
    });
    return NextResponse.json(application);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const existing = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (existing) return err("Application already submitted", 409);

    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 400);

    const { pref1, pref2 } = parsed.data;

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [pref1, pref2] } },
      include: {
        allowedPrograms: { include: { program: true } },
      },
    });

    if (clusters.length !== 2) return err("One or more selected clusters do not exist", 400);

    for (const cluster of clusters) {
      const cp = cluster.allowedPrograms.find(
        (ap) => ap.program.name === student.program
      );
      if (!cp) {
        return err(`Your program (${student.program}) does not have slots in "${cluster.name}"`, 403);
      }
      if (cp.enrolled >= cp.slots) {
        return err(`All ${cp.slots} slots for "${student.program}" in "${cluster.name}" are full`, 403);
      }
    }

    const application = await prisma.application.create({
      data: {
        studentId: session.id,
        clusterPref1: pref1,
        clusterPref2: pref2,
        status: "pending",
      },
      include: {
        student: { select: { fullName: true, department: true, program: true } },
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Submission failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 400);

    const { pref1, pref2 } = parsed.data;

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (!application) return err("No application found", 404);
    if (application.status !== "pending") return err("Application already processed", 400);

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    const clusters = await prisma.cluster.findMany({
      where: { id: { in: [pref1, pref2] } },
      include: {
        allowedPrograms: { include: { program: true } },
      },
    });

    if (clusters.length !== 2) return err("Invalid cluster selection", 400);

    for (const cluster of clusters) {
      const cp = cluster.allowedPrograms.find(
        (ap) => ap.program.name === student.program
      );
      if (!cp) {
        return err(`Your program (${student.program}) is not eligible for "${cluster.name}"`, 403);
      }
      if (cp.enrolled >= cp.slots) {
        return err(`"${student.program}" slots in "${cluster.name}" are full`, 403);
      }
    }

    const updated = await prisma.application.update({
      where: { studentId: session.id },
      data: { clusterPref1: pref1, clusterPref2: pref2 },
      include: { student: { select: { fullName: true, department: true, program: true } } },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Update failed", 500);
  }
}
