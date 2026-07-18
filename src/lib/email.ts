import { sendEmail, sendTemplateEmail } from "./email/service";

export { sendEmail, sendTemplateEmail };

interface EmailParams {
  studentName: string;
  studentEmail: string;
  studentId: string;
}

interface ClusterEmailParams extends EmailParams {
  clusterName: string;
  clusterLocation?: string;
  reason?: string;
}

interface SubmissionEmailParams extends EmailParams {
  clusterPref1: number;
  clusterPref2: number;
  clusters: any[];
  allocations: any[];
  phases: any[];
}

export async function sendSubmissionEmail(params: SubmissionEmailParams) {
  const { studentEmail, studentName, studentId, allocations, phases, clusters } = params;
  const clusterMap = Object.fromEntries(clusters.map((c: any) => [c.id, c]));

  const p1a = allocations.find((a: any) => phases.find((p: any) => p.id === a.phaseId)?.phaseNumber === 1);
  const p2a = allocations.find((a: any) => phases.find((p: any) => p.id === a.phaseId)?.phaseNumber === 2);
  const ph1 = p1a ? phases.find((p: any) => p.id === p1a.phaseId) : null;
  const ph2 = p2a ? phases.find((p: any) => p.id === p2a.phaseId) : null;
  const c1 = ph1 ? clusterMap[ph1.clusterId] : null;
  const c2 = ph2 ? clusterMap[ph2.clusterId] : null;

  function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  }

  const result = await sendTemplateEmail("submission_confirmed", studentEmail, {
    studentName,
    studentId,
    phase1Cluster: c1?.name || "TBD",
    phase1Dates: ph1 ? `${fmt(ph1.startDate)} – ${fmt(ph1.endDate)}` : "TBD",
    phase1Staff: c1?.staff?.map((s: any) => s.name).join(", ") || "TBD",
    phase2Cluster: c2?.name || "TBD",
    phase2Dates: ph2 ? `${fmt(ph2.startDate)} – ${fmt(ph2.endDate)}` : "TBD",
    phase2Staff: c2?.staff?.map((s: any) => s.name).join(", ") || "TBD",
  });

  if (!result.success) {
    const html = buildFallbackSubmissionHtml(params);
    await sendEmail(studentEmail, `🎉 IPT Placement Confirmed — ${studentName}`, html);
  }
}

export async function sendAllocationEmail(params: ClusterEmailParams) {
  const result = await sendTemplateEmail("allocation_confirmed", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    clusterName: params.clusterName,
    clusterLocation: params.clusterLocation || "",
  });

  if (!result.success) {
    const html = buildSimpleHtml("IPT Allocation Confirmed", `Your IPT cluster allocation has been confirmed: ${params.clusterName}`);
    await sendEmail(params.studentEmail, `IPT Allocation — ${params.clusterName}`, html);
  }
}

export async function sendTransferApprovedEmail(params: ClusterEmailParams) {
  const result = await sendTemplateEmail("transfer_approved", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    clusterName: params.clusterName,
    clusterLocation: params.clusterLocation || "",
  });
  if (!result.success) {
    const html = buildSimpleHtml("✅ Transfer Approved", `Your transfer to ${params.clusterName} has been approved.`);
    await sendEmail(params.studentEmail, `✅ Transfer Approved — ${params.clusterName}`, html);
  }
}

export async function sendTransferRejectedEmail(params: ClusterEmailParams) {
  const result = await sendTemplateEmail("transfer_rejected", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    clusterName: params.clusterName,
    reason: params.reason || "No specific reason provided",
  });
  if (!result.success) {
    const html = buildSimpleHtml("❌ Transfer Not Approved", `Your transfer request was not approved. Reason: ${params.reason || "N/A"}`);
    await sendEmail(params.studentEmail, "❌ Transfer Request Update", html);
  }
}

export async function sendReportReminderEmail(params: { studentName: string; studentEmail: string }) {
  const result = await sendTemplateEmail("report_reminder", params.studentEmail, {
    studentName: params.studentName,
  });
  if (!result.success) {
    const html = buildSimpleHtml("📋 Report Reminder", "This is a reminder to submit your IPT report.");
    await sendEmail(params.studentEmail, "IPT Report Submission Reminder", html);
  }
}

function buildSimpleHtml(title: string, message: string): string {
  return `<div style="font-family: Arial;max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="color:#2563eb;">${title}</h2>
    <p style="color:#475569;">${message}</p>
  </div>`;
}

function buildFallbackSubmissionHtml(params: SubmissionEmailParams): string {
  const clusterMap = Object.fromEntries(params.clusters.map((c: any) => [c.id, c]));
  const p1 = params.allocations?.find((a: any) => params.phases.find((p: any) => p.id === a.phaseId)?.phaseNumber === 1);
  const p2 = params.allocations?.find((a: any) => params.phases.find((p: any) => p.id === a.phaseId)?.phaseNumber === 2);
  const c1 = p1 ? clusterMap[p1.clusterId] : null;
  const c2 = p2 ? clusterMap[p2.clusterId] : null;
  return `<div style="font-family: Arial;max-width:600px;margin:0 auto;">
    <h2 style="color:#2563eb;">🎉 IPT Placement Confirmed!</h2>
    <p>Dear ${params.studentName},</p>
    <p>${c1 ? `Phase 1: ${c1.name}` : ""}</p>
    <p>${c2 ? `Phase 2: ${c2.name}` : ""}</p>
  </div>`;
}
