import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireStaff();

    const staff = await prisma.staff.findUnique({
      where: { id: session.id },
      include: { cluster: { select: { id: true, name: true, location: true } } },
    });

    if (!staff) return NextResponse.json(null);

    const phases = await prisma.phase.findMany({
      where: { clusterId: staff.clusterId, session: { isActive: true } },
      orderBy: { phaseNumber: "asc" },
    });

    const phase1 = phases.find((p) => p.phaseNumber === 1);
    const phase2 = phases.find((p) => p.phaseNumber === 2);

    const [phase1Students, phase2Students] = await Promise.all([
      phase1
        ? prisma.phaseAllocation.findMany({
            where: { phaseId: phase1.id },
            include: {
              application: { include: { student: { select: { id: true, studentId: true, fullName: true, program: true, department: true } } } },
            },
          })
        : Promise.resolve([]),
      phase2
        ? prisma.phaseAllocation.findMany({
            where: { phaseId: phase2.id },
            include: {
              application: { include: { student: { select: { id: true, studentId: true, fullName: true, program: true, department: true } } } },
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      staff,
      cluster: staff.cluster,
      phase1Students: phase1Students.map((pa) => ({
        id: pa.application.student.id,
        student: pa.application.student,
      })),
      phase2Students: phase2Students.map((pa) => ({
        id: pa.application.student.id,
        student: pa.application.student,
      })),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
