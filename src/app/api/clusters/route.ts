import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clusters = await prisma.cluster.findMany({
      include: {
        staff: { select: { name: true, email: true } },
        allowedPrograms: {
          include: { program: { select: { id: true, name: true, departmentId: true } } },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(clusters);
  } catch {
    return NextResponse.json({ error: "Failed to fetch clusters" }, { status: 500 });
  }
}
