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

export const DEFAULT_TEMPLATES: EmailTemplateDef[] = [
  {
    key: "submission_confirmed",
    name: "Submission Confirmed",
    category: "applications",
    subject: "🎉 IPT Placement Confirmed — {{studentName}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 IPT Placement Confirmed!</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Industrial Practical Training 2025/2026</p>
  </div>
  <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
    <p style="font-size: 16px; color: #1e293b;">Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p style="color: #475569; line-height: 1.6;">Congratulations! Your IPT cluster placement has been confirmed.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0;">
      <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; color: #2563eb;">Phase 1 — {{phase1Cluster}}</h3>
        <p style="margin: 0; color: #64748b; font-size: 13px;">{{phase1Dates}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Supervisors: {{phase1Staff}}</p>
      </div>
      <div style="padding: 20px;">
        <h3 style="margin: 0 0 8px; color: #059669;">Phase 2 — {{phase2Cluster}}</h3>
        <p style="margin: 0; color: #64748b; font-size: 13px;">{{phase2Dates}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Supervisors: {{phase2Staff}}</p>
      </div>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your assigned cluster on the start date.</p>
  </div>
</div>`,
    variables: ["studentName", "studentId", "phase1Cluster", "phase1Dates", "phase1Staff", "phase2Cluster", "phase2Dates", "phase2Staff"],
    required: true,
  },
  {
    key: "allocation_confirmed",
    name: "Allocation Confirmed",
    category: "applications",
    subject: "IPT Allocation — {{clusterName}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">IPT Allocation Confirmed</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your IPT cluster allocation has been confirmed:</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2563eb;">{{clusterName}}</p>
      <p style="margin: 8px 0 0; color: #64748b;">Location: {{clusterLocation}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to the cluster location on the start date.</p>
  </div>
</div>`,
    variables: ["studentName", "studentId", "clusterName", "clusterLocation"],
    required: true,
  },
  {
    key: "transfer_approved",
    name: "Transfer Approved",
    category: "transfers",
    subject: "✅ Transfer Approved — {{clusterName}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">✅ Transfer Approved</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your cluster transfer request has been <strong style="color: #059669;">approved</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">{{clusterName}}</p>
      <p style="margin: 8px 0 0; color: #64748b;">Location: {{clusterLocation}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your new cluster immediately.</p>
  </div>
</div>`,
    variables: ["studentName", "studentId", "clusterName", "clusterLocation"],
    required: true,
  },
  {
    key: "transfer_rejected",
    name: "Transfer Rejected",
    category: "transfers",
    subject: "❌ Transfer Request Update",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">❌ Transfer Not Approved</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your cluster transfer request has been <strong style="color: #dc2626;">not approved</strong>.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">You will remain in your current cluster: <strong>{{clusterName}}</strong>.</p>
  </div>
</div>`,
    variables: ["studentName", "studentId", "clusterName", "reason"],
    required: true,
  },
  {
    key: "report_reminder",
    name: "Report Reminder",
    category: "applications",
    subject: "IPT Report Submission Reminder",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📋 Report Reminder</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{studentName}}</strong>,</p>
    <p>This is a reminder to submit your IPT report before the deadline.</p>
    <p>Please log in to the IPT portal to upload your report.</p>
  </div>
</div>`,
    variables: ["studentName"],
    required: false,
  },
  {
    key: "test_email",
    name: "Test Email",
    category: "system",
    subject: "IPT Test Email",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #6366f1; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🧪 Test Email</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>This is a test email from the IPT Application System.</p>
    <p>If you received this, your email configuration is working correctly.</p>
    <p style="color: #94a3b8; font-size: 12px;">Sent at: {{timestamp}}</p>
  </div>
</div>`,
    variables: ["timestamp"],
    required: false,
  },
];

const VAR_REGEX = /\{\{(\w+)\}\}/g;

export function applyTemplate(template: { subject: string; body: string }, vars: Record<string, string>): { subject: string; html: string } {
  const subject = template.subject.replace(VAR_REGEX, (_m: string, key: string) => vars[key] ?? `{{${key}}}`);
  const html = template.body.replace(VAR_REGEX, (_m: string, key: string) => vars[key] ?? `{{${key}}}`);
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
