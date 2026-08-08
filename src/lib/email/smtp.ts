import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { acquireSendSlot } from "./throttle";

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

  // Auto-correct port/secure mismatches so a wrong saved value can't break email.
  //  - 465 = implicit TLS (secure true)
  //  - 587 / 25 = STARTTLS (secure false)
  let secure = rawSecure === "true" || rawSecure === "1";
  if (port === 465) secure = true;
  if (port === 587 || port === 25) secure = false;

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

function isTransient(err: any): boolean {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("450") ||
    msg.includes("throttl") ||
    msg.includes("limit") ||
    msg.includes("rate") ||
    msg.includes("ecoonreset") ||
    msg.includes("etimedout") ||
    msg.includes("econn") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("try again later")
  );
}

const RETRY_DELAYS_MS = [1000, 3000, 8000];

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

  let lastError: string | undefined;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    await acquireSendSlot();
    try {
      await transporter.sendMail({
        from: `"${config.senderName}" <${config.from}>`,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (err: any) {
      lastError = err?.message || "SMTP send failed";
      // Only retry transient/throttling failures; abort immediately on hard rejects.
      if (!isTransient(err) || attempt === RETRY_DELAYS_MS.length) {
        return { success: false, error: lastError };
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
  return { success: false, error: lastError };
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
