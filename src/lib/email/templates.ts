import { prisma } from "@/lib/db";

export interface EmailTemplateDef {
  key: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  required?: boolean;
}

/** Shared branded layout: maroon header band → centered MUST logo → body card. */
function emailLayout(title: string, content: string, subtitle?: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #7a1315, #640f11); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${title}</h1>
    ${subtitle ? `<p style="color: #f3d7d8; margin: 8px 0 0; font-size: 13px;">${subtitle}</p>` : ""}
  </div>
  <div style="text-align: center; padding: 20px 24px 4px;">
    <img src="{{logoUrl}}" alt="MUST" width="80" height="81" style="display: inline-block; width: 80px; height: auto;" />
  </div>
  <div style="background: #f8fafc; padding: 16px 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    ${content}
  </div>
</div>`;
}

const BTN_PRIMARY = "background: #14763b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;";
const BTN_OUTLINE = "background: #ffffff; color: #14763b; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; border: 1px solid #7eb493;";

export const DEFAULT_TEMPLATES: EmailTemplateDef[] = [
  {
    key: "submission_confirmed",
    name: "Submission Confirmed",
    category: "applications",
    subject: "IPT Placement Confirmed — {{studentName}}",
    body: emailLayout(
      "IPT Placement Confirmed",
      `<p style="font-size: 15px; color: #1e293b;">Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p style="color: #475569; line-height: 1.6;">Congratulations! Your IPT cluster placement has been confirmed.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0;">
      <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; color: #14763b;">Phase 1 — {{phase1Cluster}}</h3>
        <p style="margin: 0; color: #64748b; font-size: 13px;">{{phase1Dates}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Supervisors: {{phase1Staff}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Venue: {{phase1Venue}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Group: {{phase1Group}}</p>
      </div>
      <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; color: #14763b;">Phase 2 — {{phase2Cluster}}</h3>
        <p style="margin: 0; color: #64748b; font-size: 13px;">{{phase2Dates}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Supervisors: {{phase2Staff}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Venue: {{phase2Venue}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Group: {{phase2Group}}</p>
      </div>
      <div style="padding: 16px 20px; text-align: center;">
        <p style="margin: 0 0 10px; color: #475569; font-size: 13px;"><strong>Save your schedule to your calendar:</strong></p>
        <a href="{{phase1CalendarGoogle}}" style="${BTN_PRIMARY} margin: 4px;">Add Phase 1 to Google</a>
        <a href="{{phase1CalendarIcs}}" style="${BTN_OUTLINE} margin: 4px;">Add Phase 1 to Apple</a>
        <br>
        <a href="{{phase2CalendarGoogle}}" style="${BTN_PRIMARY} margin: 4px;">Add Phase 2 to Google</a>
        <a href="{{phase2CalendarIcs}}" style="${BTN_OUTLINE} margin: 4px;">Add Phase 2 to Apple</a>
      </div>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your assigned cluster on the start date.</p>`,
      "Industrial Practical Training 2025/2026"
    ),
    variables: ["studentName", "studentId", "phase1Cluster", "phase1Dates", "phase1Staff", "phase1Venue", "phase1Group", "phase1CalendarGoogle", "phase1CalendarIcs", "phase2Cluster", "phase2Dates", "phase2Staff", "phase2Venue", "phase2Group", "phase2CalendarGoogle", "phase2CalendarIcs"],
    required: true,
  },
  {
    key: "allocation_confirmed",
    name: "Allocation Confirmed",
    category: "applications",
    subject: "IPT Allocation — {{clusterName}}",
    body: emailLayout(
      "IPT Allocation Confirmed",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your IPT cluster allocation has been confirmed:</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #14763b;">{{clusterName}}</p>
      <p style="margin: 8px 0 0; color: #64748b;">Location: {{clusterLocation}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to the cluster location on the start date.</p>`
    ),
    variables: ["studentName", "studentId", "clusterName", "clusterLocation"],
    required: true,
  },
  {
    key: "transfer_approved",
    name: "Transfer Approved",
    category: "transfers",
    subject: "Transfer Approved — {{clusterName}}",
    body: emailLayout(
      "Transfer Approved",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your cluster transfer request has been <strong style="color: #14763b;">approved</strong>.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #14763b;">{{clusterName}}</p>
      <p style="margin: 8px 0 0; color: #64748b;">Location: {{clusterLocation}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your new cluster immediately.</p>`
    ),
    variables: ["studentName", "studentId", "clusterName", "clusterLocation"],
    required: true,
  },
  {
    key: "transfer_rejected",
    name: "Transfer Rejected",
    category: "transfers",
    subject: "Transfer Request Update",
    body: emailLayout(
      "Transfer Not Approved",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your cluster transfer request has been <strong style="color: #7a1315;">not approved</strong>.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">You will remain in your current cluster: <strong>{{clusterName}}</strong>.</p>`
    ),
    variables: ["studentName", "studentId", "clusterName", "reason"],
    required: true,
  },
  {
    key: "password_reset",
    name: "Password Reset",
    category: "auth",
    subject: "Reset your IPT password",
    body: emailLayout(
      "Password Reset",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>We received a request to reset your password. Use the link below to set a new password. This link is only valid for one use.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{resetLink}}" style="${BTN_PRIMARY}">Reset My Password</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link expires in <strong>24 hours</strong>. If you did not request a password reset, please ignore this email.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["name", "resetLink", "appName"],
    required: true,
  },
  {
    key: "staff_rejected",
    name: "Facilitator Rejected",
    category: "staff",
    subject: "Your facilitator account was not approved",
    body: emailLayout(
      "Account Not Approved",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>We regret to inform you that your facilitator registration has been <strong style="color: #7a1315;">not approved</strong>.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">If you believe this is a mistake, please contact the IPT coordinator.</p>`
    ),
    variables: ["name", "reason", "appName"],
    required: false,
  },
  {
    key: "account_created",
    name: "Account Created",
    category: "auth",
    subject: "Welcome to the IPT Portal, {{name}}",
    body: emailLayout(
      "Account Created",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>Your <strong>{{role}}</strong> account on the IPT Portal has been created successfully. You can now sign in to continue.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{loginLink}}" style="${BTN_PRIMARY}">Sign In</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["name", "role", "loginLink", "appName"],
    required: true,
  },
  {
    key: "account_activation",
    name: "Account Activation",
    category: "auth",
    subject: "Activate your IPT Portal account",
    body: emailLayout(
      "Account Activation",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>An account has been created for you. Use the link below to activate your account and set your password:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{activationLink}}" style="${BTN_PRIMARY}">Activate My Account</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link expires in <strong>24 hours</strong>. If you did not request this, please ignore this email.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["name", "activationLink", "expiresAt", "appName"],
    required: true,
  },
  {
    key: "account_activated",
    name: "Account Activated",
    category: "auth",
    subject: "Your IPT Portal account is now active",
    body: emailLayout(
      "Account Activated",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>Congratulations! Your account has been <strong style="color: #14763b;">activated</strong> successfully. You can now sign in using your email or phone number.</p>
    {{#temporaryPassword}}<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 6px;"><strong>Your temporary password:</strong></p>
      <p style="margin: 0; font-family: monospace; font-size: 16px; color: #14763b; font-weight: bold;">{{temporaryPassword}}</p>
      <p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">You will be required to change it after signing in.</p>
    </div>{{/temporaryPassword}}
    {{#clusterName}}<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Assigned Cluster:</strong> {{clusterName}}</p>
    </div>{{/clusterName}}
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{loginLink}}" style="${BTN_PRIMARY}">Sign In</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["name", "loginLink", "clusterName", "temporaryPassword", "appName"],
    required: true,
  },
  {
    key: "login_notification",
    name: "Login Notification",
    category: "auth",
    subject: "New login to your IPT Portal account",
    body: emailLayout(
      "New Login Detected",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>We noticed a new login to your IPT Portal account.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px;">
      <p style="margin: 4px 0;"><strong>Browser:</strong> {{browser}}</p>
      <p style="margin: 4px 0;"><strong>Operating System:</strong> {{os}}</p>
      <p style="margin: 4px 0;"><strong>Device:</strong> {{device}}</p>
      <p style="margin: 4px 0;"><strong>Location:</strong> {{location}}</p>
      <p style="margin: 4px 0;"><strong>IP Address:</strong> {{ip}}</p>
      <p style="margin: 4px 0;"><strong>Time:</strong> {{time}}</p>
    </div>
    <p style="color: #64748b; font-size: 13px;">If this was you, you can ignore this email. If you did not sign in, please reset your password immediately.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["name", "browser", "os", "device", "location", "ip", "time", "appName"],
    required: false,
  },
  {
    key: "announcement",
    name: "Cluster Announcement",
    category: "announcements",
    subject: "{{title}} — {{clusterName}}",
    body: emailLayout(
      "Cluster Announcement",
      `<p>Dear <strong>{{studentName}}</strong>,</p>
    <p>A new announcement has been posted for your cluster <strong>{{clusterName}}</strong>.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #14763b;">{{title}}</p>
      <p style="margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap;">{{body}}</p>
    </div>
    <p style="color: #64748b; font-size: 13px;">Posted by <strong>{{facilitator}}</strong></p>
    {{#attachment}}<p style="margin: 12px 0;"><a href="{{attachmentUrl}}" style="${BTN_OUTLINE} font-size: 13px; font-weight: bold; display: inline-block;">{{attachmentName}}</a></p>{{/attachment}}
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["studentName", "clusterName", "title", "body", "facilitator", "attachmentUrl", "attachmentName", "appName"],
    required: true,
  },
  {
    key: "reapplication_result",
    name: "Reapplication Result",
    category: "applications",
    subject: "IPT Reapplication {{status}}",
    body: emailLayout(
      "Reapplication {{status}}",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your IPT reapplication request has been <strong style="color: {{statusColor}};">{{status}}</strong>.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;">1. <strong>{{cluster1}}</strong></p>
      <p style="margin: 4px 0;">2. <strong>{{cluster2}}</strong></p>
    </div>
    {{#reason}}<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p></div>{{/reason}}
    <p style="color: #64748b; font-size: 14px;">{{message}}</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["studentName", "studentId", "status", "statusColor", "cluster1", "cluster2", "reason", "message", "appName"],
    required: true,
  },
  {
    key: "group_updated",
    name: "Group / Venue Updated",
    category: "applications",
    subject: "Your IPT venue/group has been updated",
    body: emailLayout(
      "Venue / Group Updated",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your venue/group for <strong>{{clusterName}}</strong> ({{phaseLabel}}) has been updated.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Venue:</strong> {{venue}}</p>
      <p style="margin: 4px 0;"><strong>Group:</strong> {{group}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your assigned venue.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["studentName", "studentId", "clusterName", "phaseLabel", "venue", "group", "appName"],
    required: true,
  },
  {
    key: "shift_reminder",
    name: "Cluster Shift Reminder",
    category: "applications",
    subject: "Reminder: Cluster shift in a few days",
    body: emailLayout(
      "Cluster Shift Reminder",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>This is a friendly reminder that you will be moving to your next IPT cluster soon.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Current cluster:</strong> {{currentCluster}}</p>
      <p style="margin: 4px 0;"><strong>Next cluster:</strong> {{nextCluster}}</p>
      <p style="margin: 4px 0;"><strong>Venue:</strong> {{venue}}</p>
      <p style="margin: 4px 0;"><strong>Group:</strong> {{group}}</p>
      <p style="margin: 4px 0;"><strong>Shift date:</strong> {{shiftDate}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please prepare your reports and report to your new venue on time.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["studentName", "studentId", "currentCluster", "nextCluster", "venue", "group", "shiftDate", "appName"],
    required: true,
  },
  {
    key: "phase2_confirmed",
    name: "Phase 2 Allocation Confirmed",
    category: "applications",
    subject: "Your Phase 2 allocation is ready",
    body: emailLayout(
      "Phase 2 Allocation",
      `<p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your Phase 2 IPT allocation has been confirmed.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0; font-size: 16px; font-weight: bold; color: #14763b;">{{clusterName}}</p>
      <p style="margin: 4px 0;"><strong>Venue:</strong> {{venue}}</p>
      <p style="margin: 4px 0;"><strong>Group:</strong> {{group}}</p>
      <p style="margin: 4px 0;"><strong>Dates:</strong> {{phaseDates}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your new cluster and venue on the start date.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["studentName", "studentId", "clusterName", "venue", "group", "phaseDates", "appName"],
    required: true,
  },
  {
    key: "staff_transfer_result",
    name: "Facilitator Cluster Transfer Result",
    category: "staff",
    subject: "Cluster Transfer {{status}}",
    body: emailLayout(
      "Cluster Transfer {{status}}",
      `<p>Dear <strong>{{name}}</strong>,</p>
    <p>Your cluster transfer request has been <strong style="color: {{statusColor}};">{{status}}</strong>.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>From:</strong> {{fromCluster}}</p>
      <p style="margin: 4px 0;"><strong>To:</strong> {{toCluster}}</p>
    </div>
    {{#reason}}<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Note:</strong> {{reason}}</p></div>{{/reason}}
    <p style="color: #64748b; font-size: 14px;">{{message}}</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>`
    ),
    variables: ["name", "status", "statusColor", "fromCluster", "toCluster", "reason", "message", "appName"],
    required: true,
  },
  {
    key: "test_email",
    name: "Test Email",
    category: "system",
    subject: "IPT Test Email",
    body: emailLayout(
      "Test Email",
      `<p>This is a test email from the IPT Application System.</p>
    <p>If you received this, your email configuration is working correctly.</p>
    <p style="color: #94a3b8; font-size: 12px;">Sent at: {{timestamp}}</p>`
    ),
    variables: ["timestamp"],
    required: false,
  },
];

const VAR_REGEX = /\{\{(\w+)\}\}/g;
const CONDITIONAL_REGEX = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
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

function renderSection(body: string, vars: Record<string, string>): string {
  return body
    .replace(CONDITIONAL_REGEX, (_m: string, key: string, inner: string) => {
      return vars[key] ? inner : "";
    })
    .replace(VAR_REGEX, (_m: string, key: string) => escapeHtml(vars[key] ?? `{{${key}}}`));
}

export function applyTemplate(template: { subject: string; body: string }, vars: Record<string, string>): { subject: string; html: string } {
  const subject = template.subject.replace(VAR_REGEX, (_m: string, key: string) => vars[key] ?? `{{${key}}}`);
  const html = renderSection(template.body, vars);
  return { subject, html };
}

export async function syncDefaultTemplates() {
  for (const tpl of DEFAULT_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: { name: tpl.name, category: tpl.category, subject: tpl.subject, body: tpl.body, variables: JSON.stringify(tpl.variables), required: tpl.required || false },
      create: { key: tpl.key, name: tpl.name, category: tpl.category, subject: tpl.subject, body: tpl.body, variables: JSON.stringify(tpl.variables), enabled: true, required: tpl.required || false },
    });
  }
}

export async function syncDefaultSettings() {
  const defaults: { key: string; type: string; value: string }[] = [
    { key: "smtp_host", type: "string", value: process.env.SMTP_HOST || "" },
    { key: "smtp_port", type: "string", value: process.env.SMTP_PORT || "587" },
    { key: "smtp_secure", type: "boolean", value: process.env.SMTP_SECURE || "false" },
    { key: "smtp_user", type: "string", value: process.env.SMTP_USER || "" },
    { key: "smtp_pass", type: "password", value: process.env.SMTP_PASS || "" },
    { key: "smtp_from", type: "string", value: process.env.SMTP_FROM || "noreply@ipt.herpydevs.com" },
    { key: "smtp_sender_name", type: "string", value: process.env.SMTP_SENDER_NAME || "IPT System" },
    { key: "minio_endpoint", type: "string", value: process.env.MINIO_ENDPOINT || "" },
    { key: "minio_port", type: "string", value: process.env.MINIO_PORT || "9000" },
    { key: "minio_secure", type: "boolean", value: process.env.MINIO_USE_SSL || "false" },
    { key: "minio_access_key", type: "string", value: process.env.MINIO_ACCESS_KEY || "" },
    { key: "minio_secret_key", type: "password", value: process.env.MINIO_SECRET_KEY || "" },
    { key: "minio_bucket", type: "string", value: process.env.MINIO_BUCKET || "ipt-uploads" },
  ];

  for (const s of defaults) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { type: s.type },
      create: { key: s.key, value: s.value, type: s.type },
    });
  }
}

export async function getEmailTemplate(key: string) {
  return prisma.emailTemplate.findUnique({ where: { key } });
}

export async function listEmailTemplates() {
  return prisma.emailTemplate.findMany({ orderBy: { category: "asc" } });
}

export async function updateEmailTemplate(key: string, data: { subject?: string; body?: string; enabled?: boolean }) {
  return prisma.emailTemplate.update({ where: { key }, data });
}

export async function resetEmailTemplate(key: string) {
  const def = DEFAULT_TEMPLATES.find((t) => t.key === key);
  if (!def) throw new Error(`Template "${key}" not found`);
  return prisma.emailTemplate.update({
    where: { key },
    data: { subject: def.subject, body: def.body },
  });
}
