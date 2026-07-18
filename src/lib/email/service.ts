import { Resend } from "resend";
import { sendViaSmtp } from "./smtp";
import { createEmailLog, markEmailSent, markEmailFailed } from "./logs";
import { getEmailTemplate, applyTemplate } from "./templates";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string, templateKey?: string) {
  const log = await createEmailLog({ recipient: to, subject, template: templateKey });

  const smtpResult = await sendViaSmtp(to, subject, html);
  if (smtpResult.success) {
    await markEmailSent(log.id);
    return { success: true, provider: "smtp" };
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "IPT System <noreply@ipt.herpydevs.com>",
        to,
        subject,
        html,
      });
      await markEmailSent(log.id);
      return { success: true, provider: "resend" };
    } catch (err: any) {
      await markEmailFailed(log.id, err.message || "Resend failed");
      return { success: false, error: err.message };
    }
  }

  if (!smtpResult.success && !resend) {
    const msg = "No email provider configured (SMTP/Resend)";
    await markEmailFailed(log.id, msg);
    return { success: false, error: msg };
  }

  await markEmailSent(log.id);
  return { success: true, provider: "smtp" };
}

export async function sendTemplateEmail(
  templateKey: string,
  to: string,
  variables: Record<string, string>,
) {
  const template = await getEmailTemplate(templateKey);
  if (!template || !template.enabled) {
    return { success: false, error: `Template "${templateKey}" not found or disabled` };
  }

  const { subject, html } = applyTemplate(template, variables);
  return sendEmail(to, subject, html, templateKey);
}
