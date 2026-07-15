import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { departmentSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.department.findMany({
      include: { programs: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const dept = await prisma.department.create({ data: parsed.data });
    return NextResponse.json(dept, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.code === "P2002") return NextResponse.json({ error: "Department with that name or abbreviation already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const parsed = departmentSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const dept = await prisma.department.update({ where: { id }, data: parsed.data });
    return NextResponse.json(dept);
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.code === "P2002") return NextResponse.json({ error: "Name or abbreviation already in use" }, { status: 409 });
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete. Department may have programs assigned." }, { status: 500 });
  }
}
