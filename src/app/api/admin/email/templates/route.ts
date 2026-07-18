import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listEmailTemplates, getEmailTemplate, updateEmailTemplate, resetEmailTemplate, syncDefaultTemplates } from "@/lib/email/templates";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const tpl = await getEmailTemplate(key);
      return NextResponse.json(tpl);
    }
    const templates = await listEmailTemplates();
    return NextResponse.json(templates);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { action } = await request.json();

    if (action === "sync") {
      await syncDefaultTemplates();
      return NextResponse.json({ success: true });
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
    const { key, subject, body, enabled } = await request.json();
    if (!key) return err("Key is required", 400);

    const data: any = {};
    if (subject !== undefined) data.subject = subject;
    if (body !== undefined) data.body = body;
    if (enabled !== undefined) data.enabled = enabled;

    const tpl = await updateEmailTemplate(key, data);
    return NextResponse.json(tpl);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { key } = await request.json();
    if (!key) return err("Key is required", 400);

    await resetEmailTemplate(key);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Failed", 500);
  }
}
