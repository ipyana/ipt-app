"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { RefreshCw, Pencil, RotateCcw, Loader2, FileText } from "lucide-react";

export function EmailTemplatesConfig() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });

  async function loadTemplates() {
    const res = await fetch("/api/admin/email/templates");
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
  }

  useEffect(() => { loadTemplates().finally(() => setLoading(false)); }, []);

  async function handleSync() {
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

  async function handleSave() {
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

  async function handleReset(key: string) {
    await fetch("/api/admin/email/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    loadTemplates();
    setMessage({ type: "success", text: "Template reset to default" });
  }

  async function toggleEnabled(tpl: any) {
    await fetch("/api/admin/email/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: tpl.key, enabled: !tpl.enabled }),
    });
    loadTemplates();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Edit subjects and HTML bodies. Use {'{{variableName}}'} for template variables.</p>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={saving}>
          <RefreshCw className="h-3 w-3 mr-1" /> Sync Templates
        </Button>
      </div>

      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{message.text}</div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Actions</TableHead>
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
                    <Button variant="ghost" size="sm" onClick={() => toggleEnabled(tpl)}>
                      {tpl.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditDialog(tpl); setEditForm({ subject: tpl.subject, body: tpl.body }); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleReset(tpl.key)}><RotateCcw className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <p className="text-xs text-slate-400">Use {'{{variableName}}'} for template variables and {'{{#key}}...{{/key}}'} for optional sections.</p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
