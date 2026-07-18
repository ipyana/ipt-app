import { prisma } from "@/lib/db";

export async function createEmailLog(params: {
  recipient: string;
  subject: string;
  template?: string;
}) {
  return prisma.emailLog.create({
    data: {
      recipient: params.recipient,
      subject: params.subject,
      template: params.template || null,
      status: "pending",
    },
  });
}

export async function markEmailSent(logId: number) {
  return prisma.emailLog.update({
    where: { id: logId },
    data: { status: "sent", sentAt: new Date() },
  });
}

export async function markEmailFailed(logId: number, error: string) {
  return prisma.emailLog.update({
    where: { id: logId },
    data: { status: "failed", error },
  });
}

export async function listEmailLogs(params: {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}) {
  const where: any = {};
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { recipient: { contains: params.search, mode: "insensitive" } },
      { subject: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit || 50,
      skip: params.offset || 0,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return { items, total };
}
