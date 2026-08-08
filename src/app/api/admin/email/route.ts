import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEmailAdmin } from "@/lib/auth";
import { listEmailLogs } from "@/lib/email/logs";
import { sendEmail } from "@/lib/email/service";
import { resendEmail } from "@/lib/email/resend";
import { testSmtpConnection } from "@/lib/email/smtp";
import { testStorageConnection } from "@/lib/storage";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireEmailAdmin();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "logs";

    if (tab === "settings") {
      const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from", "smtp_sender_name",
        "minio_endpoint", "minio_port", "minio_secure", "minio_access_key", "minio_secret_key", "minio_bucket"];
      const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
      const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
      return NextResponse.json(map);
    }

    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await listEmailLogs({ status, search, limit, offset });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireEmailAdmin();
    const body = await request.json();
    const { action, to } = body;

    if (action === "test") {
      if (!to) return err("Recipient email is required", 400);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";
      const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7a1315, #640f11); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Test Email</h1>
        </div>
        <div style="text-align: center; padding: 20px 24px 4px;">
          <img src="${appUrl}/must_Logo.png" alt="MUST" width="80" height="81" style="display: inline-block; width: 80px; height: auto;" />
        </div>
        <div style="background: #f8fafc; padding: 16px 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p>This is a test email from the IPT Application System.</p>
          <p>If you received this, your email configuration is working correctly.</p>
          <p style="color: #94a3b8; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      </div>`;
      const result = await sendEmail(to, "IPT Test Email", html, "test_email");
      return NextResponse.json(result);
    }

    if (action === "test-smtp") {
      const result = await testSmtpConnection();
      return NextResponse.json(result);
    }

    if (action === "test-storage") {
      const result = await testStorageConnection();
      return NextResponse.json(result);
    }

    if (action === "resend") {
      const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Boolean) : [];
      if (ids.length === 0) return err("No email IDs selected", 400);

      const logs = await prisma.emailLog.findMany({ where: { id: { in: ids } } });
      if (logs.length === 0) return err("No matching email logs", 404);

      const results = [];
      for (const log of logs) {
        const r = await resendEmail({ id: log.id, recipient: log.recipient, subject: log.subject, template: log.template, body: log.body });
        results.push({ id: log.id, ...r });
      }
      const ok = results.filter((r) => r.ok).length;
      return NextResponse.json({ success: true, results, message: `Resent ${ok}/${results.length} emails` });
    }

    return err("Invalid action", 400);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireEmailAdmin();
    const { key, value } = await request.json();
    if (!key) return err("Key is required", 400);

    await prisma.setting.upsert({
      where: { key },
      update: { value: value ?? "" },
      create: { key, value: value ?? "" },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
