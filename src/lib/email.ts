import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ClusterInfo {
  id: number;
  name: string;
  description: string;
  location: string;
}

interface PhaseInfo {
  id: number;
  phaseNumber: number;
  startDate: Date;
  endDate: Date;
  cluster: { id: number; name: string; staff: { name: string }[] };
}

interface SubmissionEmailParams {
  studentName: string;
  studentEmail: string;
  studentId: string;
  clusterPref1: number;
  clusterPref2: number;
  clusters: ClusterInfo[];
  allocations: { phaseId: number; clusterId: number; phase: { phaseNumber: number } }[];
  phases: PhaseInfo[];
}

export async function sendSubmissionEmail(params: SubmissionEmailParams) {
  const { studentName, studentEmail, studentId, clusters, allocations, phases } = params;

  const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c]));

  const phase1Alloc = allocations.find(
    (a) => phases.find((p) => p.id === a.phaseId)?.phaseNumber === 1
  );
  const phase2Alloc = allocations.find(
    (a) => phases.find((p) => p.id === a.phaseId)?.phaseNumber === 2
  );

  const phase1 = phase1Alloc
    ? phases.find((p) => p.id === phase1Alloc.phaseId)
    : null;
  const phase2 = phase2Alloc
    ? phases.find((p) => p.id === phase2Alloc.phaseId)
    : null;

  const c1 = phase1 ? clusterMap[phase1.cluster.id] : null;
  const c2 = phase2 ? clusterMap[phase2.cluster.id] : null;

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 IPT Placement Confirmed!</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Industrial Practical Training 2025/2026</p>
      </div>

      <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="font-size: 16px; color: #1e293b;">Dear <strong>${studentName}</strong> (${studentId}),</p>
        <p style="color: #475569; line-height: 1.6;">
          Congratulations! Your IPT cluster placement has been confirmed. Below are your assigned clusters and schedule.
        </p>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0;">
          ${phase1 && c1 ? `
          <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="background: #2563eb; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">1</div>
              <h2 style="margin: 0; font-size: 18px; color: #1e293b;">Phase 1 — ${c1.name}</h2>
            </div>
            <table style="width: 100%; font-size: 13px; color: #475569;">
              <tr><td style="padding: 4px 0; width: 100px; color: #94a3b8;">Duration:</td><td style="padding: 4px 0;">${formatDate(phase1.startDate)} – ${formatDate(phase1.endDate)} (5 weeks)</td></tr>
              <tr><td style="padding: 4px 0; color: #94a3b8;">Location:</td><td style="padding: 4px 0;">${c1.location}</td></tr>
              <tr><td style="padding: 4px 0; color: #94a3b8;">Supervisors:</td><td style="padding: 4px 0;">${phase1.cluster.staff.map((s) => s.name).join(", ")}</td></tr>
            </table>
          </div>` : ""}

          ${phase2 && c2 ? `
          <div style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="background: #059669; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">2</div>
              <h2 style="margin: 0; font-size: 18px; color: #1e293b;">Phase 2 — ${c2.name}</h2>
            </div>
            <table style="width: 100%; font-size: 13px; color: #475569;">
              <tr><td style="padding: 4px 0; width: 100px; color: #94a3b8;">Duration:</td><td style="padding: 4px 0;">${formatDate(phase2.startDate)} – ${formatDate(phase2.endDate)} (5 weeks)</td></tr>
              <tr><td style="padding: 4px 0; color: #94a3b8;">Location:</td><td style="padding: 4px 0;">${c2.location}</td></tr>
              <tr><td style="padding: 4px 0; color: #94a3b8;">Supervisors:</td><td style="padding: 4px 0;">${phase2.cluster.staff.map((s) => s.name).join(", ")}</td></tr>
            </table>
          </div>` : ""}
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            <strong>📋 Assessment:</strong> University supervisors will visit you at your workstation during the final weeks of the program. You will be notified of the specific date by your cluster supervisor.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please report to your assigned cluster location on <strong>${formatDate(phase1?.startDate || new Date())}</strong>.
          If you have any questions, contact your cluster supervisor or the IPT coordinator.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          This is an automated message from the IPT Application System.<br />
          Mbeya University of Science and Technology — CoICT
        </p>
      </div>
    </div>
  `;

  if (!resend) {
    console.log("[EMAIL] Resend not configured. Skipping submission email to:", studentEmail);
    console.log("[EMAIL] Would send:", studentName, "→ Phase1:", c1?.name, "Phase2:", c2?.name);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "IPT System <noreply@ipt.university.ac.ke>",
      to: studentEmail,
      subject: `🎉 IPT Placement Confirmed — ${studentName}`,
      html: emailHtml,
    });
    console.log("[EMAIL] Submission email sent to:", studentEmail);
  } catch (error) {
    console.error("[EMAIL] Failed to send submission email:", error);
  }
}

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
