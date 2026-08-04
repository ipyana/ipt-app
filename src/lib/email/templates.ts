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
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Location: {{phase1Location}}</p>
      </div>
      <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; color: #059669;">Phase 2 — {{phase2Cluster}}</h3>
        <p style="margin: 0; color: #64748b; font-size: 13px;">{{phase2Dates}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Supervisors: {{phase2Staff}}</p>
        <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Location: {{phase2Location}}</p>
      </div>
      <div style="padding: 16px 20px; text-align: center;">
        <p style="margin: 0 0 10px; color: #475569; font-size: 13px;"><strong>Save your schedule to your calendar:</strong></p>
        <a href="{{phase1CalendarGoogle}}" style="background: #2563eb; color: white; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">Add Phase 1 to Google</a>
        <a href="{{phase1CalendarIcs}}" style="background: #ffffff; color: #2563eb; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px; border: 1px solid #bfdbfe;">Add Phase 1 to Apple</a>
        <br>
        <a href="{{phase2CalendarGoogle}}" style="background: #059669; color: white; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">Add Phase 2 to Google</a>
        <a href="{{phase2CalendarIcs}}" style="background: #ffffff; color: #059669; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px; border: 1px solid #a7f3d0;">Add Phase 2 to Apple</a>
      </div>
    </div>
    <p style="color: #64748b; font-size: 14px;">Please report to your assigned cluster on the start date.</p>
  </div>
</div>`,
    variables: ["studentName", "studentId", "phase1Cluster", "phase1Dates", "phase1Staff", "phase1Location", "phase1CalendarGoogle", "phase1CalendarIcs", "phase2Cluster", "phase2Dates", "phase2Staff", "phase2Location", "phase2CalendarGoogle", "phase2CalendarIcs"],
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
    key: "password_reset",
    name: "Password Reset",
    category: "auth",
    subject: "Reset your IPT password",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #4f46e5; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Password Reset</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>We received a request to reset your password. Use the link below to set a new password. This link is only valid for one use.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{resetLink}}" style="background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">Reset My Password</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link expires in <strong>24 hours</strong>. If you did not request a password reset, please ignore this email.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "resetLink", "appName"],
    required: true,
  },
  {
    key: "otp_email",
    name: "Verification Code",
    category: "auth",
    subject: "Your verification code",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Verification Code</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>Your one-time verification code is:</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">{{otpCode}}</p>
    </div>
    <p style="color: #64748b; font-size: 13px;">This code expires in <strong>5 minutes</strong>.</p>
  </div>
</div>`,
    variables: ["name", "otpCode"],
    required: false,
  },
  {
    key: "staff_approved",
    name: "Facilitator Approved",
    category: "staff",
    subject: "Your facilitator account has been approved",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Account Approved</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>Congratulations! Your facilitator account has been <strong style="color: #059669;">approved</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #059669;">{{clusterName}}</p>
      <p style="margin: 8px 0 0; color: #64748b;">Location: {{clusterLocation}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">You can now log in using your email or phone number to view your assigned students.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "clusterName", "clusterLocation", "appName"],
    required: true,
  },
  {
    key: "staff_rejected",
    name: "Facilitator Rejected",
    category: "staff",
    subject: "Your facilitator account was not approved",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Account Not Approved</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>We regret to inform you that your facilitator registration has been <strong style="color: #dc2626;">not approved</strong>.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">If you believe this is a mistake, please contact the IPT coordinator.</p>
  </div>
</div>`,
    variables: ["name", "reason", "appName"],
    required: false,
  },
  {
    key: "admin_activation",
    name: "Admin Account Activation",
    category: "auth",
    subject: "Activate your admin account",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #7c3aed; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Admin Account Activation</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>An admin account has been created for you. Use the link below to activate your account and set your password:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{activationLink}}" style="background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Activate My Account</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link expires in <strong>24 hours</strong>. If you did not request this, please ignore this email.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "activationLink", "appName"],
    required: true,
  },
  {
    key: "account_created",
    name: "Account Created",
    category: "auth",
    subject: "Welcome to the IPT Portal, {{name}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Account Created</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>Your <strong>{{role}}</strong> account on the IPT Portal has been created successfully. You can now sign in to continue.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{loginLink}}" style="background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Sign In</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "role", "loginLink", "appName"],
    required: true,
  },
  {
    key: "account_activation",
    name: "Account Activation",
    category: "auth",
    subject: "Activate your IPT Portal account",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #7c3aed; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Account Activation</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>An account has been created for you. Use the link below to activate your account and set your password:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{activationLink}}" style="background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Activate My Account</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link expires in <strong>24 hours</strong>. If you did not request this, please ignore this email.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "activationLink", "expiresAt", "appName"],
    required: true,
  },
  {
    key: "account_activated",
    name: "Account Activated",
    category: "auth",
    subject: "Your IPT Portal account is now active",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Account Activated</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>Congratulations! Your account has been <strong style="color: #059669;">activated</strong> successfully. You can now sign in using your email or phone number.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{loginLink}}" style="background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Sign In</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "loginLink", "appName"],
    required: true,
  },
  {
    key: "login_notification",
    name: "Login Notification",
    category: "auth",
    subject: "New login to your IPT Portal account",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">New Login Detected</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    <p>We noticed a new login to your IPT Portal account.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px;">
      <p style="margin: 4px 0;"><strong>Browser:</strong> {{browser}}</p>
      <p style="margin: 4px 0;"><strong>Operating System:</strong> {{os}}</p>
      <p style="margin: 4px 0;"><strong>Device:</strong> {{device}}</p>
      <p style="margin: 4px 0;"><strong>Location:</strong> {{location}}</p>
      <p style="margin: 4px 0;"><strong>IP Address:</strong> {{ip}}</p>
      <p style="margin: 4px 0;"><strong>Time:</strong> {{time}}</p>
    </div>
    <p style="color: #64748b; font-size: 13px;">If this was you, you can ignore this email. If you did not sign in, please reset your password immediately.</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["name", "browser", "os", "device", "location", "ip", "time", "appName"],
    required: false,
  },
  {
    key: "announcement",
    name: "Cluster Announcement",
    category: "announcements",
    subject: "📢 {{title}} — {{clusterName}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #0ea5e9; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📢 Cluster Announcement</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{studentName}}</strong>,</p>
    <p>A new announcement has been posted for your cluster <strong>{{clusterName}}</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #0ea5e9;">{{title}}</p>
      <p style="margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap;">{{body}}</p>
    </div>
    <p style="color: #64748b; font-size: 13px;">Posted by <strong>{{facilitator}}</strong></p>
    {{#attachment}}<p style="margin: 12px 0;"><a href="{{attachmentUrl}}" style="background: #f0f9ff; color: #0284c7; text-decoration: none; padding: 10px 16px; border-radius: 8px; border: 1px solid #bae6fd; font-size: 13px; font-weight: bold; display: inline-block;">📎 {{attachmentName}}</a></p>{{/attachment}}
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["studentName", "clusterName", "title", "body", "facilitator", "attachmentUrl", "attachmentName", "appName"],
    required: true,
  },
  {
    key: "reapplication_result",
    name: "Reapplication Result",
    category: "applications",
    subject: "IPT Reapplication {{status}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #6366f1; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Reapplication {{status}}</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>{{studentName}}</strong> ({{studentId}}),</p>
    <p>Your IPT reapplication request has been <strong style="color: {{statusColor}};">{{status}}</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;">1. <strong>{{cluster1}}</strong></p>
      <p style="margin: 4px 0;">2. <strong>{{cluster2}}</strong></p>
    </div>
    {{#reason}}<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p></div>{{/reason}}
    <p style="color: #64748b; font-size: 14px;">{{message}}</p>
    <p style="color: #94a3b8; font-size: 12px;">{{appName}}</p>
  </div>
</div>`,
    variables: ["studentName", "studentId", "status", "statusColor", "cluster1", "cluster2", "reason", "message", "appName"],
    required: true,
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
const CONDITIONAL_REGEX = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

function renderSection(body: string, vars: Record<string, string>): string {
  return body
    .replace(CONDITIONAL_REGEX, (_m: string, key: string, inner: string) => {
      return vars[key] ? inner : "";
    })
    .replace(VAR_REGEX, (_m: string, key: string) => vars[key] ?? `{{${key}}}`);
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
