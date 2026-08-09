import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateTemporaryPassword } from "@/lib/password";
import { generateToken } from "@/lib/otp";
import { sendAccountCredentialsEmail, sendAccountActivationEmail, sendPasswordResetEmail } from "@/lib/email";
import { sendEmail } from "@/lib/email/service";
import { markEmailSent, markEmailFailed } from "@/lib/email/logs";

/**
 * Resend a single email based on its template.
 * - Account-credential emails: regenerate a fresh temporary password and persist it,
 *   so whatever the student/staff/admin receives will always be accepted on login.
 * - Activation / password-reset emails: regenerate the token/link.
 * - Any other email: resend the stored HTML body verbatim.
 *
 * After the attempt the ORIGINAL EmailLog row is updated to reflect the outcome
 * (sent / failed) so it stops showing as "Failed" once delivered.
 */
export async function resendEmail(log: {
  id: number;
  recipient: string;
  subject: string;
  template?: string | null;
  body?: string | null;
}): Promise<{ ok: boolean; message: string }> {
  const email = log.recipient;

  if (log.template === "account_credentials") {
    const student = await prisma.student.findUnique({ where: { email } });
    const staff = await prisma.staff.findUnique({ where: { email } });
    const admin = await prisma.admin.findUnique({ where: { email } });

    const name = student?.fullName || staff?.name || admin?.username || email;
    const role = student ? "student" : staff ? "facilitator" : admin ? "administrator" : "user";
    if (!student && !staff && !admin) {
      return { ok: false, message: `No account for ${email}` };
    }

    const tempPassword = generateTemporaryPassword();
    const hashed = await bcrypt.hash(tempPassword, 12);
    if (student) {
      const hasApplication = (await prisma.application.count({ where: { studentId: student.id } })) > 0;
      await prisma.student.update({
        where: { id: student.id },
        data: {
          password: hashed,
          mustChangePassword: true,
          // Only downgrade genuinely-unactivated students; keep active students active.
          status: hasApplication ? student.status : "pending_activation",
          temporaryPasswordExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
      });
    } else if (staff) {
      await prisma.staff.update({ where: { id: staff.id }, data: { password: hashed, mustChangePassword: true } });
    } else if (admin && admin.role !== "super_admin") {
      await prisma.admin.update({ where: { id: admin.id }, data: { password: hashed, mustChangePassword: true } });
    } else {
      return { ok: false, message: `Super admin resets are handled separately` };
    }

    const approvalNote = staff?.status === "pending_approval"
      ? "Your registration is awaiting approval. You can sign in with this password once approved."
      : undefined;
    await sendAccountCredentialsEmail({ name, email, role, temporaryPassword: tempPassword, approvalNote });
    await markEmailSent(log.id);
    return { ok: true, message: `New temporary password sent to ${email}` };
  }

  if (log.template === "account_activation") {
    const name = email.split("@")[0];
    const token = await generateToken(email, "staff_activation");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
    const activationLink = `${baseUrl}/activate-account?token=${token}&email=${encodeURIComponent(email)}`;
    await sendAccountActivationEmail({ name, email, activationLink });
    await markEmailSent(log.id);
    return { ok: true, message: `Activation link sent to ${email}` };
  }

  if (log.template === "password_reset") {
    const name = email.split("@")[0];
    const token = await generateToken(email, "password_reset");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const sent = await sendPasswordResetEmail({ name, email, resetLink });
    if (sent) {
      await markEmailSent(log.id);
      return { ok: true, message: `Reset link sent to ${email}` };
    }
    await markEmailFailed(log.id, "Resend failed");
    return { ok: false, message: `Failed to send reset link to ${email}` };
  }

  // Everything else: resend stored content verbatim.
  if (log.body) {
    const result = await sendEmail(email, log.subject, log.body, log.template || undefined);
    if (result.success) {
      await markEmailSent(log.id);
      return { ok: true, message: `Resent "${log.subject}" to ${email}` };
    }
    await markEmailFailed(log.id, result.error || "Resend failed");
    return { ok: false, message: `Failed to resend "${log.subject}" to ${email}: ${result.error || "unknown error"}` };
  }

  return { ok: false, message: `No stored content to resend for ${email}` };
}
