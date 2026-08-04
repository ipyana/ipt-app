import { sendEmail, sendTemplateEmail } from "./email/service";
import { buildGoogleCalendarUrl, buildIcsApiUrl } from "./calendar";

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" });
}

function toIso(d: string) {
  return new Date(d).toISOString();
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

  const p1Title = c1 ? `IPT Phase 1 — ${c1.name}` : "IPT Phase 1";
  const p2Title = c2 ? `IPT Phase 2 — ${c2.name}` : "IPT Phase 2";

  const result = await sendTemplateEmail("submission_confirmed", studentEmail, {
    studentName,
    studentId,
    phase1Cluster: c1?.name || "TBD",
    phase1Dates: ph1 ? `${fmtDate(ph1.startDate)} – ${fmtDate(ph1.endDate)}` : "TBD",
    phase1Staff: c1?.staff?.map((s: any) => s.name).join(", ") || "TBD",
    phase1Location: c1?.location || "",
    phase1CalendarGoogle: ph1 ? buildGoogleCalendarUrl({ title: p1Title, description: `IPT Phase 1 cluster placement: ${c1?.name}`, location: c1?.location, startDate: toIso(ph1.startDate), endDate: toIso(ph1.endDate) }) : "",
    phase1CalendarIcs: ph1 ? buildIcsApiUrl({ title: p1Title, description: `IPT Phase 1 cluster placement: ${c1?.name}`, location: c1?.location, startDate: toIso(ph1.startDate), endDate: toIso(ph1.endDate) }) : "",
    phase2Cluster: c2?.name || "TBD",
    phase2Dates: ph2 ? `${fmtDate(ph2.startDate)} – ${fmtDate(ph2.endDate)}` : "TBD",
    phase2Staff: c2?.staff?.map((s: any) => s.name).join(", ") || "TBD",
    phase2Location: c2?.location || "",
    phase2CalendarGoogle: ph2 ? buildGoogleCalendarUrl({ title: p2Title, description: `IPT Phase 2 cluster placement: ${c2?.name}`, location: c2?.location, startDate: toIso(ph2.startDate), endDate: toIso(ph2.endDate) }) : "",
    phase2CalendarIcs: ph2 ? buildIcsApiUrl({ title: p2Title, description: `IPT Phase 2 cluster placement: ${c2?.name}`, location: c2?.location, startDate: toIso(ph2.startDate), endDate: toIso(ph2.endDate) }) : "",
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

export async function sendPasswordResetEmail(params: { name: string; email: string; resetLink: string }) {
  const result = await sendTemplateEmail("password_reset", params.email, {
    name: params.name,
    resetLink: params.resetLink,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "Reset your IPT password",
      buildSimpleHtml("Password Reset", `Click here to reset your password: ${params.resetLink}`));
  }
}

export async function sendAccountCreatedEmail(params: { name: string; email: string; role: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
  const result = await sendTemplateEmail("account_created", params.email, {
    name: params.name,
    role: params.role,
    loginLink: appUrl,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, `Welcome to the IPT Portal, ${params.name}`,
      buildSimpleHtml("Account Created", `Your ${params.role} account has been created. Sign in at ${appUrl}`));
  }
}

export async function sendAccountActivationEmail(params: { name: string; email: string; activationLink: string }) {
  const result = await sendTemplateEmail("account_activation", params.email, {
    name: params.name,
    activationLink: params.activationLink,
    expiresAt: "24 hours",
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "Activate your IPT Portal account",
      buildSimpleHtml("Account Activation", `Click here to activate your account: ${params.activationLink}`));
  }
}

export async function sendAccountActivatedEmail(params: { name: string; email: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
  const result = await sendTemplateEmail("account_activated", params.email, {
    name: params.name,
    loginLink: appUrl,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "Your IPT Portal account is now active",
      buildSimpleHtml("Account Activated", `Your account is active. Sign in at ${appUrl}`));
  }
}

export async function sendLoginNotificationEmail(params: {
  name: string;
  email: string;
  browser: string;
  os: string;
  device: string;
  location: string;
  ip: string;
}) {
  const result = await sendTemplateEmail("login_notification", params.email, {
    name: params.name,
    browser: params.browser,
    os: params.os,
    device: params.device,
    location: params.location,
    ip: params.ip,
    time: new Date().toLocaleString("en-TZ", { dateStyle: "medium", timeStyle: "short" }),
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "New login to your IPT Portal account",
      buildSimpleHtml("New Login Detected", `Browser: ${params.browser} · OS: ${params.os} · Device: ${params.device} · Location: ${params.location}`));
  }
}

export async function sendAnnouncementEmail(params: {
  studentName: string;
  studentEmail: string;
  clusterName: string;
  title: string;
  body: string;
  facilitator: string;
  attachmentUrl?: string;
  attachmentName?: string;
}) {
  const result = await sendTemplateEmail("announcement", params.studentEmail, {
    studentName: params.studentName,
    clusterName: params.clusterName,
    title: params.title,
    body: params.body,
    facilitator: params.facilitator,
    attachmentUrl: params.attachmentUrl || "",
    attachmentName: params.attachmentName || "",
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.studentEmail, `📢 ${params.title} — ${params.clusterName}`,
      buildSimpleHtml(`📢 ${params.title}`, `${params.body}`));
  }
}

export async function sendReapplicationResultEmail(params: {
  studentName: string;
  studentEmail: string;
  studentId: string;
  status: "approved" | "rejected";
  cluster1: string;
  cluster2: string;
  reason?: string;
}) {
  const approved = params.status === "approved";
  const result = await sendTemplateEmail("reapplication_result", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    status: approved ? "Approved" : "Rejected",
    statusColor: approved ? "#059669" : "#dc2626",
    cluster1: params.cluster1,
    cluster2: params.cluster2,
    reason: params.reason || "",
    message: approved
      ? "Your new cluster preferences have been confirmed. Please report to your assigned clusters."
      : "Your reapplication was not approved. You will remain in your current allocation.",
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.studentEmail, `IPT Reapplication ${approved ? "Approved" : "Rejected"}`,
      buildSimpleHtml(`Reapplication ${approved ? "Approved" : "Rejected"}`, `${params.cluster1} · ${params.cluster2}`));
  }
}

export async function sendAdminActivationEmail(params: { name: string; email: string; activationLink: string }) {
  const result = await sendTemplateEmail("admin_activation", params.email, {
    name: params.name,
    activationLink: params.activationLink,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "Activate your admin account",
      buildSimpleHtml("Admin Account Activation", `Click here to activate: ${params.activationLink}`));
  }
}

export async function sendStaffApprovedEmail(params: { name: string; email: string; clusterName: string; clusterLocation: string }) {
  const result = await sendTemplateEmail("staff_approved", params.email, {
    name: params.name,
    clusterName: params.clusterName,
    clusterLocation: params.clusterLocation,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "Your facilitator account has been approved",
      buildSimpleHtml("Account Approved", `Your facilitator account has been approved. Cluster: ${params.clusterName}`));
  }
}

export async function sendStaffRejectedEmail(params: { name: string; email: string; reason?: string }) {
  const result = await sendTemplateEmail("staff_rejected", params.email, {
    name: params.name,
    reason: params.reason || "No specific reason provided",
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, "Your facilitator account was not approved",
      buildSimpleHtml("Account Not Approved", `Reason: ${params.reason || "N/A"}`));
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
