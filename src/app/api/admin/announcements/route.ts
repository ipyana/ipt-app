import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteStoredFile } from "@/lib/storage";
import { announcementSchema } from "@/lib/validations";
import { uploadAnnouncementFile } from "@/lib/storage";
import { sendAnnouncementEmail, sendEmail } from "@/lib/email";
import { sendEmailsInBatches } from "@/lib/batch";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const MAX_FILE_SIZE = 9 * 1024 * 1024;

export async function GET() {
  try {
    await requireAdmin();
    const announcements = await prisma.announcement.findMany({
      include: {
        cluster: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
        _count: { select: { reads: true, staffReads: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(announcements);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const formData = await request.formData();
    const title = (formData.get("title") as string) || "";
    const body = (formData.get("body") as string) || "";
    const audience = (formData.get("audience") as string) || "students";
    const clusterRaw = formData.get("clusterId") as string | null;

    const parsed = announcementSchema.safeParse({
      title,
      body,
      audience,
      clusterId: clusterRaw && clusterRaw !== "" && clusterRaw !== "null" ? Number(clusterRaw) : null,
    });
    if (!parsed.success) return err(parsed.error.issues[0].message, 400);
    const data = parsed.data;

    if (data.audience === "students" && !data.clusterId) {
      return err("Select a cluster when targeting students", 400);
    }

    const admin = await prisma.admin.findUnique({ where: { id: session.id } });
    const staffAuthor = admin
      ? await prisma.staff.findFirst({ where: { OR: [{ email: admin.email }, { name: admin.username }] } })
      : null;

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) return err("File size must be under 9MB", 400);
      const uploaded = await uploadAnnouncementFile(file);
      attachmentUrl = uploaded.url;
      attachmentName = uploaded.name;
    }

    const announcement = await prisma.announcement.create({
      data: {
        clusterId: data.clusterId || null,
        staffId: staffAuthor?.id || null,
        title: data.title.trim(),
        body: data.body.trim(),
        audience: data.audience,
        attachmentUrl,
        attachmentName,
      },
    });

    const authorName = staffAuthor?.name || admin?.username || "System";
    await sendAnnouncementEmails(announcement, authorName, attachmentUrl, attachmentName);

    return NextResponse.json(announcement, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

async function sendAnnouncementEmails(
  announcement: { title: string; body: string; audience: string; clusterId: number | null },
  authorName: string,
  attachmentUrl?: string,
  attachmentName?: string
) {
  const audience = announcement.audience;
  const clusterName = announcement.clusterId
    ? (await prisma.cluster.findUnique({ where: { id: announcement.clusterId } }))?.name || "Your cluster"
    : "MUST IPT";

  if (audience === "students" || audience === "all") {
    const students = audience === "students" && announcement.clusterId
      ? await prisma.student.findMany({
          where: { applications: { some: { status: "allocated", allocatedCluster: announcement.clusterId! } } },
        })
      : await prisma.student.findMany();
    await sendEmailsInBatches(students, async (student) => {
      await sendAnnouncementEmail({
        studentName: student.fullName,
        studentEmail: student.email,
        clusterName,
        title: announcement.title,
        body: announcement.body,
        facilitator: authorName,
        attachmentUrl,
        attachmentName,
      });
      return true;
    });
  }

  if (audience === "staff" || audience === "all") {
    const staffList = await prisma.staff.findMany({ where: { status: "active", isActive: true } });
    await sendEmailsInBatches(staffList, async (member) => {
      await sendEmail(
        member.email,
        `${announcement.title}`,
        `<p>Dear <strong>${member.name}</strong>,</p><p>${announcement.body}</p>`
      );
      return true;
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const ids = Array.isArray(body.ids)
      ? body.ids.map(Number).filter(Boolean)
      : body.id
        ? [Number(body.id)]
        : [];
    if (ids.length === 0) return err("ID or IDs required", 400);

    const announcements = await prisma.announcement.findMany({ where: { id: { in: ids } } });
    for (const announcement of announcements) {
      if (announcement.attachmentUrl) {
        const key = decodeURIComponent(announcement.attachmentUrl.split("key=").pop() || "");
        if (key) await deleteStoredFile(key).catch(() => {});
      }
    }

    const result = await prisma.announcement.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
