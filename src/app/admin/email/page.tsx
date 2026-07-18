"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Mail, Settings, FileText, Send, RefreshCw, Eye, Pencil, RotateCcw, Loader2 } from "lucide-react";

type Tab = "templates" | "settings" | "logs";

export default function AdminEmail() {
  const [tab, setTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });
  const [testDialog, setTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [logFilter, setLogFilter] = useState("");

  async function loadTemplates() {
    const res = await fetch("/api/admin/email/templates");
    setTemplates(Array.isArray(await res.json()) ? await res.json() : []);
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/email", { method: "DELETE" });
    setSettings(await res.json());
  }

  async function loadLogs() {
    const params = new URLSearchParams();
    if (logFilter) params.set("status", logFilter);
    const res = await fetch(`/api/admin/email?${params}`);
    const data = await res.json();
    setLogs(data.items || []);
    setLogTotal(data.total || 0);
  }

  useEffect(() => {
    Promise.all([loadTemplates(), loadSettings(), loadLogs()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab === "logs") loadLogs(); }, [tab, logFilter]);

  async function handleSaveSetting(key: string, value: string) {
    setSaving(true);
    await fetch("/api/admin/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    setMessage({ type: "success", text: "Setting saved" });
    loadSettings();
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
    setTestDialog(false);
    setMessage({ type: data.success ? "success" : "error", text: data.success ? "Test email sent!" : data.error });
  }

  async function handleSyncTemplates() {
    setSaving(true);
    await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    setSaving(false);
    loadTemplates();
    setMessage({ type: "success", text: "Templates synced" });
  }

  async function handleEditTemplate(tpl: any) {
    setEditDialog(tpl);
    setEditForm({ subject: tpl.subject, body: tpl.body });
  }

  async function handleSaveTemplate() {
    if (!editDialog) return;
    setSaving(true);
    await fetch("/api/admin/email/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editDialog.key, subject: editForm.subject, body: editForm.body }),
    });
    setSaving(false);
    setEditDialog(null);
    loadTemplates();
    setMessage({ type: "success", text: "Template updated" });
  }

  async function handleResetTemplate(key: string) {
    await fetch("/api/admin/email/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    loadTemplates();
    setMessage({ type: "success", text: "Template reset to default" });
  }

  const SMTP_FIELDS = [
    { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
    { key: "smtp_port", label: "Port", type: "text", placeholder: "587" },
    { key: "smtp_secure", label: "TLS / SSL", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    { key: "smtp_user", label: "Username", type: "text", placeholder: "user@gmail.com" },
    { key: "smtp_pass", label: "Password", type: "password", placeholder: "App password" },
    { key: "smtp_from", label: "Sender Email", type: "text", placeholder: "noreply@..." },
    { key: "smtp_sender_name", label: "Sender Name", type: "text", placeholder: "IPT System" },
  ];

  const statusBadge: Record<string, any> = {
    sent: { variant: "success", label: "Sent" },
    pending: { variant: "warning", label: "Pending" },
    failed: { variant: "danger", label: "Failed" },
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Manage email templates, SMTP config, and view logs</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setTestDialog(true)}>
              <Send className="h-3 w-3 mr-1" /> Send Test
            </Button>
            <Button size="sm" variant="outline" onClick={handleSyncTemplates} disabled={saving}>
              <RefreshCw className="h-3 w-3 mr-1" /> Sync Templates
            </Button>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>{message.text}</div>
        )}

        <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 w-fit">
          {(["templates", "settings", "logs"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t === "templates" ? <FileText className="h-4 w-4" /> : t === "settings" ? <Settings className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "templates" && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : templates.map((tpl) => (
                    <TableRow key={tpl.id || tpl.key}>
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{tpl.key}</TableCell>
                      <TableCell><Badge variant="secondary">{tpl.category}</Badge></TableCell>
                      <TableCell>
                        {tpl.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(tpl)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleResetTemplate(tpl.key)}><RotateCcw className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {tab === "settings" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">SMTP Configuration</h3>
                <Button variant="outline" size="sm" onClick={handleTestSmtp} disabled={saving}>
                  <Send className="h-3 w-3 mr-1" /> Test Connection
                </Button>
              </div>
              {SMTP_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="text-right text-slate-600">{field.label}</Label>
                  {field.type === "select" ? (
                    <Select value={settings[field.key] || "false"} onChange={(e) => handleSaveSetting(field.key, e.target.value)} className="col-span-2">
                      {field.options?.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </Select>
                  ) : (
                    <div className="col-span-2 flex gap-2">
                      <Input type={field.type} value={settings[field.key] || ""} placeholder={field.placeholder}
                        onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                        onBlur={(e) => handleSaveSetting(field.key, e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === "logs" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {["", "sent", "failed", "pending"].map((s) => (
                <Button key={s} variant={logFilter === s ? "primary" : "outline"} size="sm" onClick={() => setLogFilter(s)}>
                  {s || "All"}
                </Button>
              ))}
              <span className="text-sm text-slate-400 ml-auto self-center">{logTotal} total</span>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">No email logs found</TableCell></TableRow>
                    ) : logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">{log.recipient}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{log.subject}</TableCell>
                        <TableCell className="text-xs text-slate-400">{log.template || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge[log.status]?.variant || "secondary"}>
                            {statusBadge[log.status]?.label || log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-red-500 max-w-[150px] truncate">{log.error || "—"}</TableCell>
                        <TableCell className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)}>
          {editDialog && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <DialogTitle>Edit Template: {editDialog.name}</DialogTitle>
                </div>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Subject</Label><Input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} /></div>
                  <div className="space-y-1"><Label>HTML Body</Label>
                    <textarea value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[300px] font-mono dark:bg-slate-900 dark:border-slate-700" />
                  </div>
                  <p className="text-xs text-slate-400">Use {'{{variableName}}'} for template variables</p>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </>
          )}
        </Dialog>

        <Dialog open={testDialog} onClose={() => setTestDialog(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <Send className="h-5 w-5 text-primary-600" />
              </div>
              <DialogTitle>Send Test Email</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5">
              <Label>Recipient Email</Label>
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="admin@example.com" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(false)}>Cancel</Button>
            <Button onClick={handleSendTest} disabled={saving || !testEmail}>{saving ? "Sending..." : "Send"}</Button>
          </DialogFooter>
        </Dialog>
      </div>
    </AppLayout>
  );
}
