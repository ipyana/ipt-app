"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Layers, MapPin, BookOpen, CalendarDays, Users } from "lucide-react";

interface Dept { id: number; name: string; abbreviation: string }
interface ClusterDept { department: Dept; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  locationRef: { id: number; name: string } | null;
  allowedDepartments: ClusterDept[];
}
interface PhaseInfo {
  id: number; phaseNumber: number; startDate: string; endDate: string;
  cluster: { id: number; name: string; location: string; capacity: number };
  enrolled: number;
  groups: { id: number; name: string; enrolled: number }[];
}

export default function AdminClustersManage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cluster | null>(null);
  const [form, setForm] = useState({ name: "", description: "", location: "", locationId: 0, departmentSlots: [] as { departmentId: number; slots: number }[] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cluster | null>(null);
  const [viewTarget, setViewTarget] = useState<Cluster | null>(null);
  const [phaseView, setPhaseView] = useState<0 | 1 | 2>(0);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);
  const [sessionInfo, setSessionInfo] = useState<{ name: string; startDate: string; endDate: string; weeksPerPhase: number } | null>(null);

  async function load() {
    const [cl, dp, lc] = await Promise.all([
      fetch("/api/admin/clusters").then((r) => r.json()),
      fetch("/api/admin/departments").then((r) => r.json()),
      fetch("/api/admin/locations").then((r) => r.json()),
    ]);
    setClusters(Array.isArray(cl) ? cl : []);
    setDepartments(Array.isArray(dp) ? dp : []);
    setLocations(Array.isArray(lc) ? lc.map((x: any) => ({ id: x.id, name: x.name })) : []);
  }

  async function loadPhases() {
    const res = await fetch("/api/admin/phases");
    const data = await res.json();
    if (data?.phases) setPhases(data.phases);
    if (data?.session) setSessionInfo(data.session);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", description: "", location: "", locationId: 0, departmentSlots: [] });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(c: Cluster) {
    setEditing(c);
    setForm({
      name: c.name, description: c.description || "", location: c.location || "", locationId: c.locationRef?.id || 0,
      departmentSlots: c.allowedDepartments?.map((cd) => ({ departmentId: cd.department.id, slots: cd.slots })) || [],
    });
    setError("");
    setDialogOpen(true);
  }

  function toggleDeptSlot(departmentId: number) {
    setForm((f) => {
      const existing = f.departmentSlots.findIndex((ds) => ds.departmentId === departmentId);
      if (existing >= 0) return { ...f, departmentSlots: f.departmentSlots.filter((ds) => ds.departmentId !== departmentId) };
      return { ...f, departmentSlots: [...f.departmentSlots, { departmentId, slots: 0 }] };
    });
  }

  function setSlot(departmentId: number, slots: number) {
    const v = isNaN(slots) ? 0 : slots;
    setForm((f) => ({ ...f, departmentSlots: f.departmentSlots.map((ds) => ds.departmentId === departmentId ? { ...ds, slots: v } : ds) }));
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const cleanSlots = form.departmentSlots
        .filter((ds) => typeof ds.slots === "number" && !isNaN(ds.slots) && ds.slots > 0)
        .map((ds) => ({ departmentId: ds.departmentId, slots: ds.slots }));
      const body: any = editing
        ? { id: editing.id, name: form.name, description: form.description, location: form.location, locationId: form.locationId || undefined, departmentSlots: cleanSlots, capacity: cleanSlots.reduce((s, p) => s + p.slots, 0) }
        : { name: form.name, description: form.description, location: form.location, locationId: form.locationId || undefined, departmentSlots: cleanSlots, capacity: cleanSlots.reduce((s, p) => s + p.slots, 0) };
      const res = await fetch("/api/admin/clusters", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/admin/clusters", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
    setDeleteTarget(null); load();
  }

  const totalPossibleSlots = form.departmentSlots.reduce((s, p) => s + (isNaN(p.slots) ? 0 : p.slots), 0);

  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manage Clusters</h2>
            <p className="text-sm text-slate-500">{clusters.length} clusters</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> New Cluster</Button>
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-panel p-1 w-fit">
          <button
            onClick={() => setPhaseView(0)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${phaseView === 0 ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >All</button>
          <button
            onClick={() => { setPhaseView(1); loadPhases(); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${phaseView === 1 ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >Phase 1</button>
          <button
            onClick={() => { setPhaseView(2); loadPhases(); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${phaseView === 2 ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >Phase 2</button>
        </div>

        {phaseView === 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cluster</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Department Allocations</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-slate-400">No clusters found</TableCell></TableRow>
                ) : clusters.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setViewTarget(c)}>
                    <TableCell><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-slate-400">{c.locationRef?.name || c.location}</p></TableCell>
                    <TableCell><span className="text-sm font-semibold">{c.capacity}</span></TableCell>
                    <TableCell><span className={`text-sm font-semibold ${c.currentEnrolled >= c.capacity ? "text-red-600" : "text-emerald-600"}`}>{c.currentEnrolled}</span><span className="text-xs text-slate-400"> / {c.capacity}</span></TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {c.allowedDepartments?.slice(0, 3).map((cd) => (
                          <div key={cd.department.id} className="text-xs"><span className="font-medium">{cd.department.name.slice(0, 30)}</span><span className="text-slate-400"> — {cd.enrolled}/{cd.slots}</span></div>
                        ))}
                        {(c.allowedDepartments?.length || 0) > 3 && <span className="text-xs text-slate-400">+{c.allowedDepartments!.length - 3} more</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

        {phaseView !== 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {sessionInfo && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="font-semibold text-slate-900 dark:text-white">{sessionInfo.name}</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(sessionInfo.startDate).toLocaleDateString("en-TZ")} – {new Date(sessionInfo.endDate).toLocaleDateString("en-TZ")}</span>
                  <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Phase {phaseView} · {sessionInfo.weeksPerPhase} weeks</span>
                </div>
              )}
              {phases.filter((p) => p.phaseNumber === phaseView).length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No phases created yet for this session</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {phases.filter((p) => p.phaseNumber === phaseView).map((p) => {
                    const pct = p.cluster.capacity ? Math.round((p.enrolled / p.cluster.capacity) * 100) : 0;
                    return (
                      <div key={p.id} className="rounded-lg border border-border p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{p.cluster.name}</p>
                            <p className="text-xs text-slate-400">{p.cluster.location || "No location"}</p>
                          </div>
                          <Badge variant={p.enrolled >= p.cluster.capacity ? "danger" : "success"}>{pct}% full</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><Users className="h-3.5 w-3.5" />{p.enrolled}/{p.cluster.capacity}</span>
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><BookOpen className="h-3.5 w-3.5" />{p.groups.length} groups</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full ${p.enrolled >= p.cluster.capacity ? "bg-red-500" : "bg-primary-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        {p.groups.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {p.groups.map((g) => (
                              <span key={g.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {g.name}<span className="text-slate-400">({g.enrolled})</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-400">
                          {new Date(p.startDate).toLocaleDateString("en-TZ")} – {new Date(p.endDate).toLocaleDateString("en-TZ")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <DialogTitle>{editing ? "Edit Cluster" : "New Cluster"}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Cluster Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Software Development" /></div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <select
                  value={form.locationId || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const loc = locations.find((x) => x.id === id);
                    setForm({ ...form, locationId: id, location: loc?.name || "" });
                  }}
                  className="flex h-9 w-full rounded-md border border-border bg-panel px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="">Select a location...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" /></div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
              <span className="text-slate-500">Total Capacity (sum of slots):</span>
              <span className="font-bold text-primary-600">{totalPossibleSlots}</span>
            </div>

            <div className="space-y-2">
              <Label>Assign Departments & Set Slot Limits</Label>
              <div className="grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto">
                {departments.map((d) => {
                  const existing = form.departmentSlots.find((ds) => ds.departmentId === d.id);
                  return (
                    <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <button onClick={() => toggleDeptSlot(d.id)}
                        className={`w-full text-left rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          existing ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        }`}>{d.name} ({d.abbreviation})</button>
                      {existing && (
                        <Input type="number" min={0} value={existing.slots} onChange={(e) => setSlot(d.id, Number(e.target.value))} placeholder="Slots" className="h-7 text-xs w-full mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </Dialog>

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Cluster"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all staff and program assignments.`}
          confirmLabel="Delete"
        />

        <Dialog open={!!viewTarget} onClose={() => setViewTarget(null)}>
          {viewTarget && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
                    <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle>{viewTarget.name}</DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{viewTarget.description || "No description"}</p>
                  </div>
                </div>
              </DialogHeader>
              <DialogBody>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-primary-600">{viewTarget.capacity}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Total Slots</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                    <p className={`text-2xl font-bold ${viewTarget.currentEnrolled >= viewTarget.capacity ? "text-red-600" : "text-emerald-600"}`}>{viewTarget.currentEnrolled}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Enrolled</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{viewTarget.capacity - viewTarget.currentEnrolled}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Available</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{viewTarget.locationRef?.name || viewTarget.location || "No location set"}</span>
                </div>

                {viewTarget.allowedDepartments && viewTarget.allowedDepartments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Department Allocations</span>
                    </div>
                    <div className="space-y-2">
                      {viewTarget.allowedDepartments.map((cd) => {
                        const pct = cd.slots > 0 ? Math.round((cd.enrolled / cd.slots) * 100) : 0;
                        return (
                          <div key={cd.department.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cd.department.name}</p>
                                <p className="text-xs text-slate-400">{cd.department.abbreviation}</p>
                              </div>
                              <Badge variant={pct >= 100 ? "danger" : pct > 80 ? "warning" : "success"}>
                                {cd.enrolled}/{cd.slots}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct >= 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </DialogBody>
            </>
          )}
        </Dialog>
      </div>
    </AppLayout>
  );
}
