import { prisma } from "@/lib/db";
import { sendAccountCleanupEmail } from "@/lib/email";

/**
 * Remove unactivated student accounts (status = pending_activation) older than
 * `olderThanMs`. Deletion happens FIRST so students can re-register immediately;
 * each is then emailed a "registration not completed" notice best-effort (logged
 * in EmailLog, resendable via the admin Email Logs UI). Returns counts.
 */
export async function cleanupUnactivatedStudents(olderThanMs: number): Promise<{ removed: number; emailed: number }> {
  const cutoff = new Date(Date.now() - olderThanMs);

  const candidates = await prisma.student.findMany({
    where: {
      status: "pending_activation",
      createdAt: { lt: cutoff },
      // Never remove a student who has submitted an application / been allocated.
      applications: { none: {} },
    },
    select: { id: true, fullName: true, email: true, studentId: true },
  });

  if (candidates.length === 0) return { removed: 0, emailed: 0 };

  const ids = candidates.map((c) => c.id);
  await prisma.$transaction([
    prisma.announcementRead.deleteMany({ where: { studentId: { in: ids } } }),
    prisma.application.deleteMany({ where: { studentId: { in: ids } } }),
    prisma.student.deleteMany({ where: { id: { in: ids } } }),
  ]);

  let emailed = 0;
  for (const s of candidates) {
    try {
      await sendAccountCleanupEmail({ name: s.fullName, email: s.email });
      emailed++;
    } catch { /* best-effort; failures are logged for later resend */ }
  }

  return { removed: candidates.length, emailed };
}

export const CLEANUP_DEFAULT_OLDER_THAN_MS = 8 * 60 * 60 * 1000; // 8h temp password TTL
