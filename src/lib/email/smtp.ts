import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  senderName: string;
}

async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from", "smtp_sender_name"];
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const host = map["smtp_host"] || process.env.SMTP_HOST || "";
  const user = map["smtp_user"] || process.env.SMTP_USER || "";
  const pass = map["smtp_pass"] || process.env.SMTP_PASS || "";
  if (!host || !user || !pass) return null;

  const rawPort = map["smtp_port"] || process.env.SMTP_PORT || "587";
  const rawSecure = map["smtp_secure"] || process.env.SMTP_SECURE || "";
  let port = parseInt(rawPort, 10);
  if (isNaN(port)) port = 587;

  const secure = rawSecure === "true" || rawSecure === "1" || port === 465;
  if (port === 465 && !rawSecure) {
    port = 465;
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: map["smtp_from"] || process.env.SMTP_FROM || "noreply@ipt.herpydevs.com",
    senderName: map["smtp_sender_name"] || process.env.SMTP_SENDER_NAME || "IPT System",
  };
}

export async function sendViaSmtp(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const config = await loadSmtpConfig();
  if (!config) {
    return { success: false, error: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  try {
    await transporter.sendMail({
      from: `"${config.senderName}" <${config.from}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "SMTP send failed" };
  }
}

export async function testSmtpConnection(): Promise<{ success: boolean; message: string }> {
  const config = await loadSmtpConfig();
  if (!config) {
    return { success: false, message: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  try {
    await transporter.verify();
    return { success: true, message: "SMTP connection successful" };
  } catch (err: any) {
    return { success: false, message: err.message || "Connection failed" };
  }
}
