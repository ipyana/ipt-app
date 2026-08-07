"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Users, Plus, Loader2, Zap, Trash2 } from "lucide-react";

export default function AdminGroups() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterId, setClusterId] = useState<number>(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createDialog, setCreateDialog] = useState<any>(null);
  const [createName, setCreateName] = useState("");
  const [createVenue, setCreateVenue] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadClusters() {
    const res = await fetch("/api/clusters");
    const c = await res.json();
    setClusters(Array.isArray(c) ? c : []);
    if (c[0]?.id) setClusterId(c[0].id);
  }

  async function loadData(id: number) {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/admin/groups?clusterId=${id}`);
    const d = await res.json();
    setData(d.error ? null : d);
    setLoading(false);
  }

  useEffect(() => {
    loadClusters().then(() => {});
  }, []);

  useEffect(() => {
    if (clusterId) loadData(clusterId);
  }, [clusterId]);

  async function handleCreateGroup() {
    if (!createDialog || !createName.trim()) return;
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-group", clusterId, phaseId: createDialog.id, name: createName.trim(), venueId: createVenue || undefined, location: createLocation || undefined }),
    });
    const d = await res.json();
    if (!res.ok) return setMessage({ type: "error", text: d.error || "Failed" });
    setCreateDialog(null); setCreateName(""); setCreateVenue(""); setCreateLocation("");
    setMessage({ type: "success", text: "Group created" });
    await loadData(clusterId);
  }

  async function handleMove(allocationId: number, groupId: number) {
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move-student", clusterId, allocationId, groupId }),
    });
    const d = await res.json();
    setMessage({ type: d.success ? "success" : "error", text: d.success ? "Student moved" : d.error || "Failed" });
    await loadData(clusterId);
  }

  async function handleAutoBalance(phaseId: number) {
    setBusy(true);
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "auto-balance", clusterId, phaseId }),
    });
    const d = await res.json();
    setBusy(false);
    setMessage({ type: d.success ? "success" : "error", text: d.message || d.error || "Failed" });
    await loadData(clusterId);
  }

  async function handleDeleteGroup(groupId: number) {
    if (!window.confirm("Delete this group? Students in it will be unassigned and can be re-grouped.")) return;
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-group", clusterId, groupId }),
    });
    const d = await res.json();
    setMessage({ type: d.success ? "success" : "error", text: d.message || d.error || "Failed" });
    await loadData(clusterId);
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Groups & Venues</h2>
            <p className="text-sm text-slate-500 mt-1">Manage venue groups per cluster, or auto-balance students</p>
          </div>
          <div className="w-64">
            <Select value={clusterId} onChange={(e) => setClusterId(Number(e.target.value))}>
              {clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        </div>

        {message && (
          <div className={`rounded-lg border p-3 text-sm ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>{message.text}</div>
        )}

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></div>
        ) : !data ? (
          <p className="py-16 text-center text-sm text-slate-400">Select a cluster</p>
        ) : data.phases.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No phases configured for this cluster.</p>
        ) : data.phases.map((phase: any) => (
          <div key={phase.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Phase {phase.phaseNumber}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{phase.startDate?.slice(0, 10)} – {phase.endDate?.slice(0, 10)}</span>
                <Button variant="outline" size="sm" onClick={() => setCreateDialog(phase)}>
                  <Plus className="h-3 w-3" /> Group
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAutoBalance(phase.id)} disabled={busy}>
                  <Zap className="h-3 w-3" /> {busy ? "..." : "Auto-Balance"}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {phase.groups.map((group: any) => (
                <Card key={group.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{group.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {group.location || group.venue?.name || "No location"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{group._count?.allocations || 0} students</Badge>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete group"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {phase.allocations.filter((a: any) => a.groupId === group.id).map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-800/50 px-2 py-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.application?.student?.fullName}</p>
                            <p className="text-[10px] text-slate-400">{a.application?.student?.studentId}</p>
                          </div>
                          <Select
                            value={a.groupId || ""}
                            onChange={(e) => handleMove(a.id, Number(e.target.value))}
                            className="w-28 text-xs h-7"
                          >
                            {phase.groups.map((g: any) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </Select>
                        </div>
                      ))}
                      {phase.allocations.filter((a: any) => a.groupId === group.id).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">No students</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!createDialog} onClose={() => setCreateDialog(null)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <DialogTitle>Create Group</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Group Name</Label><Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. COMP-LAB II" /></div>
            <div className="space-y-1">
              <Label>Venue</Label>
              <Select value={createVenue} onChange={(e) => setCreateVenue(e.target.value)}>
                <option value="">No venue</option>
                {(data?.venues || []).map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1"><Label>Location / Building (optional)</Label><Input value={createLocation} onChange={(e) => setCreateLocation(e.target.value)} placeholder="e.g. Block B, Floor 2" /></div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialog(null)}>Cancel</Button>
          <Button onClick={handleCreateGroup}>Create</Button>
        </DialogFooter>
      </Dialog>
    </AppLayout>
  );
}
