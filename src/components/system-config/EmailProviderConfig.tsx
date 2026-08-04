"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Send, Loader2, HardDrive } from "lucide-react";

const SMTP_FIELDS = [
  { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
  { key: "smtp_port", label: "Port", type: "text", placeholder: "587" },
  { key: "smtp_secure", label: "TLS / SSL", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  { key: "smtp_user", label: "Username", type: "text", placeholder: "user@gmail.com" },
  { key: "smtp_pass", label: "Password", type: "password", placeholder: "App password" },
  { key: "smtp_from", label: "Sender Email", type: "text", placeholder: "noreply@..." },
  { key: "smtp_sender_name", label: "Sender Name", type: "text", placeholder: "IPT System" },
];

const MINIO_FIELDS = [
  { key: "minio_endpoint", label: "Endpoint", type: "text", placeholder: "must_minio" },
  { key: "minio_port", label: "Port", type: "text", placeholder: "9000" },
  { key: "minio_secure", label: "Use TLS", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  { key: "minio_access_key", label: "Access Key", type: "text", placeholder: "..." },
  { key: "minio_secret_key", label: "Secret Key", type: "password", placeholder: "..." },
  { key: "minio_bucket", label: "Bucket", type: "text", placeholder: "ipt-uploads" },
];

const SETTING_KEYS = [
  "smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from", "smtp_sender_name",
  "minio_endpoint", "minio_port", "minio_secure", "minio_access_key", "minio_secret_key", "minio_bucket",
];

export function EmailProviderConfig() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");

  async function load() {
    const res = await fetch("/api/admin/email?tab=settings");
    const data = await res.json();
    setSettings(data || {});
  }

  useEffect(() => { load(); }, []);

  async function handleSaveSetting(key: string, value: string) {
    setSaving(true);
    await fetch("/api/admin/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTestSmtp() {
    setSaving(true);
    const res = await fetch("/api/admin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test-smtp" }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage({ type: data.success ? "success" : "error", text: data.message });
  }

  async function handleTestStorage() {
    setSaving(true);
    const res = await fetch("/api/admin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test-storage" }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage({ type: data.success ? "success" : "error", text: data.message });
  }

  async function handleSendTest() {
    if (!testEmail) return;
    setSaving(true);
    const res = await fetch("/api/admin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", to: testEmail }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage({ type: data.success ? "success" : "error", text: data.success ? "Test email sent!" : data.error });
  }

  function renderFields(fields: typeof SMTP_FIELDS) {
    return fields.map((field) => (
      <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
        <Label className="text-right text-slate-600">{field.label}</Label>
        {field.type === "select" ? (
          <Select value={settings[field.key] || "false"} onChange={(e) => handleSaveSetting(field.key, e.target.value)} className="col-span-2">
            {field.options?.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </Select>
        ) : (
          <div className="col-span-2 flex gap-2">
            <Input
              type={field.type}
              value={settings[field.key] || ""}
              placeholder={field.placeholder}
              onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              onBlur={(e) => handleSaveSetting(field.key, e.target.value)}
            />
          </div>
        )}
      </div>
    ));
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{message.text}</div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">SMTP Configuration</h3>
            <Button variant="outline" size="sm" onClick={handleTestSmtp} disabled={saving}>
              <Send className="h-3 w-3 mr-1" /> Test Connection
            </Button>
          </div>
          {renderFields(SMTP_FIELDS)}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="admin@example.com" className="max-w-xs" />
              <Button variant="outline" size="sm" onClick={handleSendTest} disabled={saving || !testEmail}>
                <Send className="h-3 w-3 mr-1" /> Send Test Email
              </Button>
              {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">File Storage (MinIO / S3)</h3>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestStorage} disabled={saving}>
              <Send className="h-3 w-3 mr-1" /> Test Connection
            </Button>
          </div>
          <p className="text-xs text-slate-400">Used for facilitator announcement uploads (max 9MB per file).</p>
          {renderFields(MINIO_FIELDS)}
        </CardContent>
      </Card>
    </div>
  );
}
