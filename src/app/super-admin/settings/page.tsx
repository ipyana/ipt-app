"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Settings, Plus, Calendar, Layers } from "lucide-react";

export default function SuperAdminSettings() {
  const [session, setSession] = useState<any>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", weeksPerPhase: 5 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/super-admin/settings");
    const data = await res.json();
    if (data.session) {
      setSession(data.session);
      setForm({
        name: data.session.name,
        startDate: data.session.startDate?.split("T")[0] || "",
        endDate: data.session.endDate?.split("T")[0] || "",
        weeksPerPhase: data.session.weeksPerPhase,
      });
    }
    setPhases(Array.isArray(data.phases) ? data.phases : []);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  const phaseGroups = phases.reduce((acc: any, ph: any) => {
    const key = ph.phaseNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ph);
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">IPT Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Configure IPT session dates and phases</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">IPT Session</h3>
              {session?.isActive && <Badge variant="success">Active</Badge>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Session Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. IPT 2025/2026" /></div>
              <div className="space-y-1.5"><Label>Weeks Per Phase</Label><Input type="number" min={1} max={10} value={form.weeksPerPhase} onChange={(e) => setForm({ ...form, weeksPerPhase: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Update Session"}</Button>
          </CardContent>
        </Card>

        {session && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                Phase Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {[1, 2].map((phaseNum) => (
                <div key={phaseNum} className="mb-6 last:mb-0">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Phase {phaseNum}
                  </h4>
                  <div className="space-y-2">
                    {(phaseGroups[phaseNum] || []).map((ph: any) => (
                      <div key={ph.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{ph.cluster?.name}</p>
                          <p className="text-xs text-slate-400">{ph.cluster?.location}</p>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ph.startDate).toLocaleDateString()} – {new Date(ph.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
