"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Users, Plus, Loader2, ArrowRightLeft } from "lucide-react";

interface Phase {
  id: number;
  phaseNumber: number;
  startDate: string;
  endDate: string;
  groups: any[];
  allocations: any[];
}

export default function StaffGroups() {
  const [cluster, setCluster] = useState<any>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createDialog, setCreateDialog] = useState<Phase | null>(null);
  const [createName, setCreateName] = useState("");
  const [createVenue, setCreateVenue] = useState("");

  async function load() {
    const res = await fetch("/api/staff/groups");
    const data = await res.json();
    if (data.error) return setMessage({ type: "error", text: data.error });
    setCluster(data.cluster);
    setPhases(Array.isArray(data.phases) ? data.phases : []);
    setVenues(Array.isArray(data.venues) ? data.venues : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreateGroup() {
    if (!createDialog || !createName.trim()) return;
    const res = await fetch("/api/staff/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-group", phaseId: createDialog.id, name: createName.trim(), venueId: createVenue || undefined }),
    });
    const data = await res.json();
    if (!res.ok) return setMessage({ type: "error", text: data.error || "Failed" });
    setCreateDialog(null); setCreateName(""); setCreateVenue("");
    setMessage({ type: "success", text: "Group created" });
    await load();
  }

  async function handleMove(allocationId: number, groupId: number) {
    const res = await fetch("/api/staff/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move-student", allocationId, groupId }),
    });
    const data = await res.json();
    setMessage({ type: data.success ? "success" : "error", text: data.success ? "Student moved" : data.error || "Failed" });
    await load();
  }

  return (
    <AppLayout role="staff">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Groups & Venues</h2>
            <p className="text-sm text-slate-500 mt-1">
              {cluster ? `Managing groups for ${cluster.name}` : "No cluster assigned"}
            </p>
          </div>
          {phases.length > 0 && (
            <Button onClick={() => setCreateDialog(phases[0])}>
              <Plus className="h-4 w-4" /> Create Group
            </Button>
          )}
        </div>

        {message && (
          <div className={`rounded-lg border p-3 text-sm ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>{message.text}</div>
        )}

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></div>
        ) : phases.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No phases configured for your cluster.</p>
        ) : phases.map((phase) => (
          <div key={phase.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Phase {phase.phaseNumber}</h3>
              <span className="text-xs text-slate-400">
                {phase.startDate?.slice(0, 10)} – {phase.endDate?.slice(0, 10)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {phase.groups.map((group) => (
                <Card key={group.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{group.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {group.venue?.name || "No venue"}
                        </p>
                      </div>
                      <Badge variant="secondary">{group._count?.allocations || 0} students</Badge>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {phase.allocations.filter((a) => a.groupId === group.id).map((a) => (
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
                            {phase.groups.map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </Select>
                        </div>
                      ))}
                      {phase.allocations.filter((a) => a.groupId === group.id).length === 0 && (
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
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
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
