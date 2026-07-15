import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface AllocationEmailParams {
  studentName: string;
  studentEmail: string;
  clusterName: string;
  clusterLocation: string;
  studentId: string;
}

export async function sendAllocationEmail(params: AllocationEmailParams) {
  if (!resend) {
    console.log("[EMAIL] Resend not configured. Skipping email to:", params.studentEmail);
    console.log("[EMAIL] Allocation:", params.studentName, "→", params.clusterName);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "IPT System <noreply@ipt.university.ac.ke>",
      to: params.studentEmail,
      subject: `IPT Allocation — ${params.clusterName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">IPT Allocation Confirmed</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Dear <strong>${params.studentName}</strong> (${params.studentId}),</p>
            <p>Your IPT cluster allocation has been confirmed:</p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2563eb;">${params.clusterName}</p>
              <p style="margin: 8px 0 0; color: #64748b;">Location: ${params.clusterLocation}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Please report to the cluster location on the start date. If you have any questions, contact your cluster supervisor.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">
              This is an automated message from the IPT Application System. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });
    console.log("[EMAIL] Allocation email sent to:", params.studentEmail);
  } catch (error) {
    console.error("[EMAIL] Failed to send allocation email:", error);
  }
}

export async function sendReportReminderEmail(params: {
  studentName: string;
  studentEmail: string;
}) {
  if (!resend) {
    console.log("[EMAIL] Resend not configured. Skipping reminder to:", params.studentEmail);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "IPT System <noreply@ipt.university.ac.ke>",
      to: params.studentEmail,
      subject: "IPT Report Submission Reminder",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Dear <strong>${params.studentName}</strong>,</p>
          <p>This is a reminder to submit your IPT report before the deadline.</p>
          <p>Please log in to the IPT portal to upload your report.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[EMAIL] Failed to send reminder:", error);
  }
}
