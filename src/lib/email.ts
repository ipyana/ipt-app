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
  facilitators?: any[];
  groupName?: string;
  groupLocation?: string;
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

/** Format a list of facilitators as "Name (phone · email)" lines, omitting missing phone. */
function formatFacilitators(staff: any[] | undefined | null): string {
  if (!staff || staff.length === 0) return "";
  return staff
    .map((s) => {
      const name = s?.name || "";
      const phone = s?.phone ? ` · ${s.phone}` : "";
      const email = s?.email ? ` · ${s.email}` : "";
      return `${name}${phone}${email}`.trim();
    })
    .filter(Boolean)
    .join("<br/>");
}

/** Build HTML facilitator rows for an email template. */
function facilitatorsHtml(staff: any[] | undefined | null): string {
  if (!staff || staff.length === 0) return "";
  return staff
    .map((s) => {
      const name = s?.name || "";
      const phone = s?.phone ? `<span>Phone: ${s.phone}</span>` : "";
      const email = s?.email ? `<span>Email: ${s.email}</span>` : "";
      return `<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin: 6px 0;">
        <p style="margin: 0; font-weight: bold; color: #1e293b; font-size: 13px;">${name}</p>
        <p style="margin: 2px 0 0; color: #475569; font-size: 12px;">${phone} ${phone && email ? "&nbsp;&nbsp;" : ""}${email}</p>
      </div>`;
    })
    .join("");
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

  const p1Group = p1a?.group?.name || "";
  const p2Group = p2a?.group?.name || "";
  const p1Venue = p1a?.group?.location || p1a?.group?.venue?.name || c1?.location || "";
  const p2Venue = p2a?.group?.location || p2a?.group?.venue?.name || c2?.location || "";
  const p1Facilitators = facilitatorsHtml(c1?.staff);
  const p2Facilitators = facilitatorsHtml(c2?.staff);

  const result = await sendTemplateEmail("submission_confirmed", studentEmail, {
    studentName,
    studentId,
    phase1Cluster: c1?.name || "TBD",
    phase1Dates: ph1 ? `${fmtDate(ph1.startDate)} – ${fmtDate(ph1.endDate)}` : "TBD",
    phase1Staff: formatFacilitators(c1?.staff) || "TBD",
    phase1Facilitators: p1Facilitators,
    phase1Venue: p1Venue,
    phase1Group: p1Group,
    phase1CalendarGoogle: ph1 ? buildGoogleCalendarUrl({ title: p1Title, description: `IPT Phase 1 cluster placement: ${c1?.name}`, location: p1Venue, startDate: toIso(ph1.startDate), endDate: toIso(ph1.endDate) }) : "",
    phase1CalendarIcs: ph1 ? buildIcsApiUrl({ title: p1Title, description: `IPT Phase 1 cluster placement: ${c1?.name}`, location: p1Venue, startDate: toIso(ph1.startDate), endDate: toIso(ph1.endDate) }) : "",
    phase2Cluster: c2?.name || "TBD",
    phase2Dates: ph2 ? `${fmtDate(ph2.startDate)} – ${fmtDate(ph2.endDate)}` : "TBD",
    phase2Staff: formatFacilitators(c2?.staff) || "TBD",
    phase2Facilitators: p2Facilitators,
    phase2Venue: p2Venue,
    phase2Group: p2Group,
    phase2CalendarGoogle: ph2 ? buildGoogleCalendarUrl({ title: p2Title, description: `IPT Phase 2 cluster placement: ${c2?.name}`, location: p2Venue, startDate: toIso(ph2.startDate), endDate: toIso(ph2.endDate) }) : "",
    phase2CalendarIcs: ph2 ? buildIcsApiUrl({ title: p2Title, description: `IPT Phase 2 cluster placement: ${c2?.name}`, location: p2Venue, startDate: toIso(ph2.startDate), endDate: toIso(ph2.endDate) }) : "",
  });

  if (!result.success) {
    const html = buildFallbackSubmissionHtml(params);
    await sendEmail(studentEmail, `IPT Placement Confirmed — ${studentName}`, html);
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
    groupName: params.groupName || "",
    groupLocation: params.groupLocation || "",
    facilitators: facilitatorsHtml(params.facilitators),
  });
  if (!result.success) {
    const facs = params.facilitators?.length ? `<br/>Facilitators:<br/>${formatFacilitators(params.facilitators)}` : "";
    const html = buildSimpleHtml("Transfer Approved", `Your transfer to ${params.clusterName} has been approved.${params.groupName ? ` Group: ${params.groupName}` : ""}${params.groupLocation ? ` (${params.groupLocation})` : ""}${facs}`);
    await sendEmail(params.studentEmail, `Transfer Approved — ${params.clusterName}`, html);
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
    const html = buildSimpleHtml("Transfer Not Approved", `Your transfer request was not approved. Reason: ${params.reason || "N/A"}`);
    await sendEmail(params.studentEmail, "Transfer Request Update", html);
  }
}

export async function sendPasswordResetEmail(params: { name: string; email: string; resetLink: string }): Promise<boolean> {
  const result = await sendTemplateEmail("password_reset", params.email, {
    name: params.name,
    resetLink: params.resetLink,
    appName: "IPT System",
  });
  if (result.success) return true;
  const fallback = await sendEmail(params.email, "Reset your IPT password",
    buildSimpleHtml("Password Reset", `Click here to reset your password: ${params.resetLink}`));
  return fallback.success;
}

export async function sendAccountCredentialsEmail(params: { name: string; email: string; role: string; temporaryPassword: string; approvalNote?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
  const result = await sendTemplateEmail("account_credentials", params.email, {
    name: params.name,
    role: params.role,
    temporaryPassword: params.temporaryPassword,
    loginLink: appUrl,
    approvalNote: params.approvalNote || "",
    appName: "IPT System",
  });
  if (!result.success) {
    const note = params.approvalNote ? ` ${params.approvalNote}` : "";
    await sendEmail(params.email, `Your IPT Portal login credentials, ${params.name}`,
      buildSimpleHtml("Your IPT Portal Credentials",
        `Your ${params.role} account has been created. Temporary password: ${params.temporaryPassword}. Sign in at ${appUrl}.${note}`));
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

export async function sendAccountActivatedEmail(params: { name: string; email: string; clusterName?: string; temporaryPassword?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
  const result = await sendTemplateEmail("account_activated", params.email, {
    name: params.name,
    loginLink: appUrl,
    clusterName: params.clusterName || "",
    temporaryPassword: params.temporaryPassword || "",
    appName: "IPT System",
  });
  if (!result.success) {
    const extra = params.temporaryPassword
      ? ` Your temporary password is <strong>${params.temporaryPassword}</strong>. You will be required to change it after signing in.`
      : "";
    await sendEmail(params.email, "Your IPT Portal account is now active",
      buildSimpleHtml("Account Activated", `Your account is active. Sign in at ${appUrl}.${extra}`));
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
    await sendEmail(params.studentEmail, `${params.title} — ${params.clusterName}`,
      buildSimpleHtml(`${params.title}`, `${params.body}`));
  }
}

export async function sendReapplicationResultEmail(params: {
  studentName: string;
  studentEmail: string;
  studentId: string;
  status: "approved" | "rejected";
  cluster1: string;
  cluster2: string;
  cluster1Location?: string;
  cluster2Location?: string;
  facilitators1?: any[];
  facilitators2?: any[];
  group1?: string;
  group2?: string;
  reason?: string;
}) {
  const approved = params.status === "approved";
  const result = await sendTemplateEmail("reapplication_result", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    status: approved ? "Approved" : "Rejected",
    statusColor: approved ? "#14763b" : "#7a1315",
    cluster1: params.cluster1,
    cluster2: params.cluster2,
    cluster1Location: params.cluster1Location || "",
    cluster2Location: params.cluster2Location || "",
    group1: params.group1 || "",
    group2: params.group2 || "",
    facilitators1: facilitatorsHtml(params.facilitators1),
    facilitators2: facilitatorsHtml(params.facilitators2),
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

export async function sendStaffTransferResultEmail(params: {
  name: string;
  email: string;
  status: "approved" | "rejected";
  fromCluster: string;
  toCluster: string;
  reason?: string;
}) {
  const approved = params.status === "approved";
  const result = await sendTemplateEmail("staff_transfer_result", params.email, {
    name: params.name,
    status: approved ? "Approved" : "Rejected",
    statusColor: approved ? "#14763b" : "#7a1315",
    fromCluster: params.fromCluster,
    toCluster: params.toCluster,
    reason: params.reason || "",
    message: approved
      ? `Your cluster transfer to ${params.toCluster} has been approved. You will now be assigned to that cluster.`
      : "Your cluster transfer request was not approved. You remain in your current cluster.",
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.email, `Cluster Transfer ${approved ? "Approved" : "Rejected"}`,
      buildSimpleHtml(`Transfer ${approved ? "Approved" : "Rejected"}`, `${params.fromCluster} → ${params.toCluster}`));
  }
}

export async function sendGroupUpdatedEmail(params: {
  studentName: string;
  studentEmail: string;
  studentId: string;
  clusterName: string;
  phaseLabel: string;
  venue: string;
  group: string;
}) {
  const result = await sendTemplateEmail("group_updated", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    clusterName: params.clusterName,
    phaseLabel: params.phaseLabel,
    venue: params.venue,
    group: params.group,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.studentEmail, "Your IPT venue/group has been updated",
      buildSimpleHtml("Venue / Group Updated", `Venue: ${params.venue} · Group: ${params.group}`));
  }
}

export async function sendShiftReminderEmail(params: {
  studentName: string;
  studentEmail: string;
  studentId: string;
  currentCluster: string;
  nextCluster: string;
  venue: string;
  group: string;
  shiftDate: string;
}) {
  const result = await sendTemplateEmail("shift_reminder", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    currentCluster: params.currentCluster,
    nextCluster: params.nextCluster,
    venue: params.venue,
    group: params.group,
    shiftDate: params.shiftDate,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.studentEmail, "Reminder: Cluster shift in a few days",
      buildSimpleHtml("Cluster Shift Reminder", `Next cluster: ${params.nextCluster} on ${params.shiftDate}`));
  }
}

export async function sendPhase2ConfirmedEmail(params: {
  studentName: string;
  studentEmail: string;
  studentId: string;
  clusterName: string;
  venue: string;
  group: string;
  phaseDates: string;
}) {
  const result = await sendTemplateEmail("phase2_confirmed", params.studentEmail, {
    studentName: params.studentName,
    studentId: params.studentId,
    clusterName: params.clusterName,
    venue: params.venue,
    group: params.group,
    phaseDates: params.phaseDates,
    appName: "IPT System",
  });
  if (!result.success) {
    await sendEmail(params.studentEmail, "Your Phase 2 allocation is ready",
      buildSimpleHtml("Phase 2 Allocation", `Cluster: ${params.clusterName} · Venue: ${params.venue} · Group: ${params.group}`));
  }
}

function escapeHtml(value: string): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}

function buildSimpleHtml(title: string, message: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #7a1315, #640f11); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${escapeHtml(title)}</h1>
    </div>
    <div style="text-align: center; padding: 20px 24px 4px;">
      <img src="${appUrl}/must_Logo.png" alt="MUST" width="80" height="81" style="display: inline-block; width: 80px; height: auto;" />
    </div>
    <div style="background: #f8fafc; padding: 16px 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
      <p style="color: #475569;">${escapeHtml(message)}</p>
    </div>
  </div>`;
}

function buildFallbackSubmissionHtml(params: SubmissionEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
  const clusterMap = Object.fromEntries(params.clusters.map((c: any) => [c.id, c]));
  const p1 = params.allocations?.find((a: any) => params.phases.find((p: any) => p.id === a.phaseId)?.phaseNumber === 1);
  const p2 = params.allocations?.find((a: any) => params.phases.find((p: any) => p.id === a.phaseId)?.phaseNumber === 2);
  const c1 = p1 ? clusterMap[p1.clusterId] : null;
  const c2 = p2 ? clusterMap[p2.clusterId] : null;
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #7a1315, #640f11); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">IPT Placement Confirmed</h1>
    </div>
    <div style="text-align: center; padding: 20px 24px 4px;">
      <img src="${appUrl}/must_Logo.png" alt="MUST" width="80" height="81" style="display: inline-block; width: 80px; height: auto;" />
    </div>
    <div style="background: #f8fafc; padding: 16px 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
      <p>Dear ${escapeHtml(params.studentName)},</p>
      ${c1 ? `<p><strong>Phase 1:</strong> ${escapeHtml(c1.name)}</p><p>Venue: ${escapeHtml(p1?.group?.location || p1?.group?.venue?.name || c1?.location || "")}</p><p>Facilitators:<br/>${formatFacilitators(c1.staff)}</p>` : ""}
      ${c2 ? `<p><strong>Phase 2:</strong> ${escapeHtml(c2.name)}</p><p>Venue: ${escapeHtml(p2?.group?.location || p2?.group?.venue?.name || c2?.location || "")}</p><p>Facilitators:<br/>${formatFacilitators(c2.staff)}</p>` : ""}
    </div>
  </div>`;
}
