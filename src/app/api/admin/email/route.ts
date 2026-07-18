import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { listEmailLogs } from "@/lib/email/logs";
import { sendEmail } from "@/lib/email/service";
import { testSmtpConnection } from "@/lib/email/smtp";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
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
    await requireAdmin();
    const { action, to } = await request.json();

    if (action === "test") {
      if (!to) return err("Recipient email is required", 400);
      const result = await sendEmail(to, "🧪 IPT Test Email", `<div style="font-family:Arial;padding:24px;">
        <h2 style="color:#6366f1;">🧪 Test Email</h2>
        <p>This is a test email from the IPT Application System.</p>
        <p style="color:#94a3b8;">Sent at: ${new Date().toISOString()}</p>
      </div>`, "test_email");
      return NextResponse.json(result);
    }

    if (action === "test-smtp") {
      const result = await testSmtpConnection();
      return NextResponse.json(result);
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
    await requireAdmin();
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

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from", "smtp_sender_name"] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json(map);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
