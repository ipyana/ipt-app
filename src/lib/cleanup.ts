import { prisma } from "@/lib/db";
import { sendAccountCleanupEmail } from "@/lib/email";

/**
 * Remove unactivated student accounts (status = pending_activation) older than
 * `olderThanMs`. Each is emailed a "registration not completed" notice before
 * being deleted. Returns counts.
 */
export async function cleanupUnactivatedStudents(olderThanMs: number): Promise<{ removed: number; emailed: number }> {
  const cutoff = new Date(Date.now() - olderThanMs);

  const candidates = await prisma.student.findMany({
    where: {
      status: "pending_activation",
      createdAt: { lt: cutoff },
    },
    select: { id: true, fullName: true, email: true, studentId: true },
  });

  if (candidates.length === 0) return { removed: 0, emailed: 0 };

  let emailed = 0;
  for (const s of candidates) {
    try {
      await sendAccountCleanupEmail({ name: s.fullName, email: s.email });
      emailed++;
    } catch { /* keep going — deletion is still safe */ }
  }

  await prisma.$transaction([
    prisma.application.deleteMany({ where: { studentId: { in: candidates.map((c) => c.id) } } }),
    prisma.announcementRead.deleteMany({ where: { studentId: { in: candidates.map((c) => c.id) } } }),
    prisma.student.deleteMany({ where: { id: { in: candidates.map((c) => c.id) } } }),
  ]);

  return { removed: candidates.length, emailed };
}

export const CLEANUP_DEFAULT_OLDER_THAN_MS = 8 * 60 * 60 * 1000; // 8h temp password TTL
