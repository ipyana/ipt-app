import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    // Public: return basic cluster info (id, name, location) for registration/landing
    if (!session) {
      const clusters = await prisma.cluster.findMany({
        select: { id: true, name: true, location: true, capacity: true },
        orderBy: { id: "asc" },
      });
      return NextResponse.json(clusters);
    }

    // Authenticated: return full cluster data
    const clusters = await prisma.cluster.findMany({
      include: {
        staff: { select: { name: true, email: true } },
        allowedDepartments: {
          include: { department: { select: { id: true, name: true, abbreviation: true } } },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(clusters);
  } catch {
    return NextResponse.json({ error: "Failed to fetch clusters" }, { status: 500 });
  }
}
