"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Layers, MapPin, Users, BarChart3, BookOpen } from "lucide-react";

interface Dept { id: number; name: string; abbreviation: string }
interface Prog { id: number; name: string; departmentId: number; department: Dept }
interface ClusterProgram { program: Prog; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  allowedPrograms: ClusterProgram[];
}

export default function AdminClustersManage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [programs, setPrograms] = useState<Prog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cluster | null>(null);
  const [form, setForm] = useState({ name: "", description: "", location: "", programSlots: [] as { programId: number; slots: number }[] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cluster | null>(null);
  const [viewTarget, setViewTarget] = useState<Cluster | null>(null);

  async function load() {
    const [cl, pr] = await Promise.all([
      fetch("/api/admin/clusters").then((r) => r.json()),
      fetch("/api/admin/programs").then((r) => r.json()),
    ]);
    setClusters(Array.isArray(cl) ? cl : []);
    setPrograms(Array.isArray(pr) ? pr : []);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", description: "", location: "", programSlots: [] });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(c: Cluster) {
    setEditing(c);
    setForm({
      name: c.name, description: c.description || "", location: c.location || "",
      programSlots: c.allowedPrograms?.map((cp) => ({ programId: cp.program.id, slots: cp.slots })) || [],
    });
    setError("");
    setDialogOpen(true);
  }

  function toggleProgramSlot(programId: number) {
    setForm((f) => {
      const existing = f.programSlots.findIndex((ps) => ps.programId === programId);
      if (existing >= 0) return { ...f, programSlots: f.programSlots.filter((ps) => ps.programId !== programId) };
      return { ...f, programSlots: [...f.programSlots, { programId, slots: 0 }] };
    });
  }

  function setSlot(programId: number, slots: number) {
    const v = isNaN(slots) ? 0 : slots;
    setForm((f) => ({ ...f, programSlots: f.programSlots.map((ps) => ps.programId === programId ? { ...ps, slots: v } : ps) }));
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const cleanSlots = form.programSlots
        .filter((ps) => typeof ps.slots === "number" && !isNaN(ps.slots) && ps.slots > 0)
        .map((ps) => ({ programId: ps.programId, slots: ps.slots }));
      const body: any = editing
        ? { id: editing.id, ...form, programSlots: cleanSlots, capacity: cleanSlots.reduce((s, p) => s + p.slots, 0) }
        : { ...form, programSlots: cleanSlots, capacity: cleanSlots.reduce((s, p) => s + p.slots, 0) };
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

  const deptGroups = programs.reduce((acc, p) => {
    const key = p.department?.name || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Prog[]>);

  const totalPossibleSlots = form.programSlots.reduce((s, p) => s + (isNaN(p.slots) ? 0 : p.slots), 0);

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

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Program Allocations</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setViewTarget(c)}>
                    <TableCell><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-slate-400">{c.location}</p></TableCell>
                    <TableCell><span className="text-sm font-semibold">{c.capacity}</span></TableCell>
                    <TableCell><span className={`text-sm font-semibold ${c.currentEnrolled >= c.capacity ? "text-red-600" : "text-emerald-600"}`}>{c.currentEnrolled}</span><span className="text-xs text-slate-400"> / {c.capacity}</span></TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {c.allowedPrograms?.slice(0, 3).map((cp) => (
                          <div key={cp.program.id} className="text-xs"><span className="font-medium">{cp.program.name.slice(0, 22)}</span><span className="text-slate-400"> — {cp.enrolled}/{cp.slots}</span></div>
                        ))}
                        {(c.allowedPrograms?.length || 0) > 3 && <span className="text-xs text-slate-400">+{c.allowedPrograms!.length - 3} more</span>}
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
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lab / room name" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" /></div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
              <span className="text-slate-500">Total Capacity (sum of slots):</span>
              <span className="font-bold text-primary-600">{totalPossibleSlots}</span>
            </div>

            <div className="space-y-2">
              <Label>Assign Programs & Set Slot Limits</Label>
              <div className="grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto">
                {Object.entries(deptGroups).map(([deptName, progs]) => (
                  <div key={deptName} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{deptName}</p>
                    <div className="space-y-2">
                      {progs.map((p) => {
                        const existing = form.programSlots.find((ps) => ps.programId === p.id);
                        return (
                          <div key={p.id} className="space-y-1">
                            <button onClick={() => toggleProgramSlot(p.id)}
                              className={`w-full text-left rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                                existing ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                              }`}>{p.name}</button>
                            {existing && (
                              <Input type="number" min={0} value={existing.slots} onChange={(e) => setSlot(p.id, Number(e.target.value))} placeholder="Slots" className="h-7 text-xs w-full" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
                  <span>{viewTarget.location || "No location set"}</span>
                </div>

                {viewTarget.allowedPrograms && viewTarget.allowedPrograms.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Program Allocations</span>
                    </div>
                    <div className="space-y-2">
                      {viewTarget.allowedPrograms.map((cp) => {
                        const pct = cp.slots > 0 ? Math.round((cp.enrolled / cp.slots) * 100) : 0;
                        return (
                          <div key={cp.program.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cp.program.name}</p>
                                <p className="text-xs text-slate-400">{cp.program.department?.abbreviation} — {cp.program.department?.name}</p>
                              </div>
                              <Badge variant={pct >= 100 ? "danger" : pct > 80 ? "warning" : "success"}>
                                {cp.enrolled}/{cp.slots}
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
