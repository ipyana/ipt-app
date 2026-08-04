import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { uploadAnnouncementFile } from "@/lib/storage";
import { sendAnnouncementEmail } from "@/lib/email";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const MAX_FILE_SIZE = 9 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({
      where: { id: session.id },
      include: { cluster: { select: { id: true, name: true } } },
    });
    if (!staff || !staff.clusterId) {
      return err("You are not assigned to any cluster", 403);
    }

    const announcements = await prisma.announcement.findMany({
      where: { clusterId: staff.clusterId },
      include: { staff: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ cluster: staff.cluster, announcements });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff || !staff.clusterId) {
      return err("You are not assigned to any cluster", 403);
    }

    const formData = await request.formData();
    const title = (formData.get("title") as string) || "";
    const body = (formData.get("body") as string) || "";
    if (!title.trim() || !body.trim()) {
      return err("Title and body are required", 400);
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return err("File size must be under 9MB", 400);
      }
      const uploaded = await uploadAnnouncementFile(file);
      attachmentUrl = uploaded.url;
      attachmentName = uploaded.name;
    }

    const announcement = await prisma.announcement.create({
      data: {
        clusterId: staff.clusterId,
        staffId: staff.id,
        title: title.trim(),
        body: body.trim(),
        attachmentUrl,
        attachmentName,
      },
      include: { staff: { select: { id: true, name: true } } },
    });

    const cluster = await prisma.cluster.findUnique({ where: { id: staff.clusterId } });
    const students = await prisma.student.findMany({
      where: {
        applications: { some: { status: "allocated", allocatedCluster: staff.clusterId } },
      },
    });

    for (const student of students) {
      try {
        await sendAnnouncementEmail({
          studentName: student.fullName,
          studentEmail: student.email,
          clusterName: cluster?.name || "Your cluster",
          title: announcement.title,
          body: announcement.body,
          facilitator: staff.name,
          attachmentUrl: attachmentUrl || undefined,
          attachmentName: attachmentName || undefined,
        });
      } catch { /* continue */ }
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
