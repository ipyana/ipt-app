import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const session = await requireAuth();
    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (!application || application.status !== "allocated") {
      return err("No active allocation", 400);
    }

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    if (!student) return err("Student not found", 404);

    const allClusters = await prisma.cluster.findMany({
      where: {
        id: { not: application.allocatedCluster! },
        allowedDepartments: {
          some: { department: { abbreviation: student.department } },
        },
      },
      include: {
        allowedDepartments: { where: { department: { abbreviation: student.department } } },
        staff: { select: { name: true } },
      },
    });

    const eligible = allClusters.filter((c) => {
      const cd = c.allowedDepartments[0];
      return cd && cd.enrolled < cd.slots;
    });

    return NextResponse.json(eligible);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Failed", 500);
  }
}
