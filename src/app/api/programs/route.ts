import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: { department: { select: { id: true, name: true, abbreviation: true } } },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    });

    const grouped = programs.reduce((acc, p) => {
      const key = `${p.department.name} (${p.department.abbreviation})`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, typeof programs>);

    return NextResponse.json({ programs, grouped });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
