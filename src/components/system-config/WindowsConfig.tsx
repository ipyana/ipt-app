"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { CalendarClock, Loader2, Power } from "lucide-react";

interface WindowConfig {
  id: number;
  type: string;
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  updatedAt: string;
}

const WINDOW_LABELS: Record<string, { label: string; description: string }> = {
  application: { label: "Application Window", description: "Students submitting a new application" },
  transfer: { label: "Transfer Window", description: "Students requesting to swap a cluster" },
  reapplication: { label: "Reapplication Window", description: "Students requesting a full reapplication" },
};

function toLocalInput(d: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function WindowsConfig() {
  const [configs, setConfigs] = useState<WindowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WindowConfig | null>(null);
  const [form, setForm] = useState({ enabled: false, startAt: "", endAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/windows");
    const data = await res.json();
    setConfigs(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(c: WindowConfig) {
    setEditing(c);
    setForm({ enabled: c.enabled, startAt: toLocalInput(c.startAt), endAt: toLocalInput(c.endAt) });
    setError("");
    setMessage(null);
  }

  async function handleSave() {
    if (!editing) return;
    setError(""); setSaving(true);
    try {
      const startIso = toIso(form.startAt);
      const endIso = toIso(form.endAt);
      if (form.enabled && (!startIso || !endIso)) {
        throw new Error("Set both start and end date/time before enabling this window");
      }
      if (startIso && endIso && new Date(startIso).getTime() > new Date(endIso).getTime()) {
        throw new Error("Start must be before end");
      }
      const res = await fetch("/api/admin/windows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: editing.type, enabled: form.enabled, startAt: startIso, endAt: endIso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: `${WINDOW_LABELS[editing.type]?.label || editing.type} updated` });
      setEditing(null);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card><CardContent className="p-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{message.text}</div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {configs.map((c) => {
              const meta = WINDOW_LABELS[c.type] || { label: c.type, description: "" };
              return (
                <div key={c.type} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">{meta.label}</p>
                      <Badge variant={c.enabled ? "success" : "danger"}>
                        {c.enabled ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                    {c.enabled && c.startAt && c.endAt && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(c.startAt).toLocaleString("en-TZ")} – {new Date(c.endAt).toLocaleString("en-TZ")}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    <CalendarClock className="h-3.5 w-3.5 mr-1" /> Configure
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onClose={() => !saving && setEditing(null)}>
        <DialogHeader>
          <DialogTitle>Configure {editing ? WINDOW_LABELS[editing.type]?.label || editing.type : ""}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {editing && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                When enabled, students can only submit within the window below. When disabled, the window is closed and students cannot submit.
              </p>

              <button
                onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
                className={`flex w-full items-center justify-between rounded-lg border-2 p-4 text-left transition-colors ${
                  form.enabled ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Power className="h-4 w-4" />
                    {form.enabled ? "Window is OPEN" : "Window is CLOSED"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {form.enabled ? "Students can submit during the scheduled period" : "Students will be blocked from submitting"}
                  </p>
                </div>
                <span className={`flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${form.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </span>
              </button>

              {form.enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Start Date & Time</Label>
                    <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Date & Time</Label>
                    <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Window"}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
