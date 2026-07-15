"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Users, CheckCircle, Clock, GraduationCap } from "lucide-react";

interface Student {
  id: number; studentId: string; fullName: string; department: string;
  program: string; email: string; createdAt: string;
  application: { status: string; allocatedCluster: number | null } | null;
  allocatedName: string | null;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<{ abbreviation: string; name: string }[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ studentId: "", fullName: "", department: "", program: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  async function load() {
    const [stuRes, deptRes] = await Promise.all([
      fetch("/api/admin/students").then((r) => r.json()),
      fetch("/api/admin/departments").then((r) => r.json()),
    ]);
    setStudents(Array.isArray(stuRes) ? stuRes : []);
    setDepartments(Array.isArray(deptRes) ? deptRes : []);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ studentId: "", fullName: "", department: "", program: "", email: "", password: "" });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({ studentId: s.studentId, fullName: s.fullName, department: s.department, program: s.program, email: s.email, password: "" });
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body: any = editing ? { id: editing.id, ...form } : form;
      if (!body.password) delete body.password;
      const res = await fetch("/api/admin/students", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/admin/students", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
    setDeleteTarget(null); load();
  }

  const filtered = students.filter((s) => {
    if (deptFilter && s.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: students.length,
    applied: students.filter((s) => s.application).length,
    allocated: students.filter((s) => s.application?.status === "allocated").length,
    pending: students.filter((s) => s.application?.status === "pending").length,
  };

  const deptAbbrevs = [...new Set(students.map((s) => s.department).filter(Boolean))].sort();

  return (
    <AppLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Students</h2>
            <p className="text-sm text-slate-500 mt-1">{students.length} registered</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Student</Button>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MiniStat icon={Users} label="Total" value={stats.total} color="blue" />
          <MiniStat icon={Search} label="Applied" value={stats.applied} color="indigo" />
          <MiniStat icon={CheckCircle} label="Allocated" value={stats.allocated} color="emerald" />
          <MiniStat icon={Clock} label="Pending" value={stats.pending} color="amber" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, or email..." className="pl-9" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm w-44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <option value="">All Departments</option>
            {deptAbbrevs.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Program</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Allocation</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{s.fullName}</p>
                      <p className="text-xs text-slate-400">{s.studentId}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-slate-500 max-w-[180px] truncate">{s.program}</TableCell>
                    <TableCell><Badge variant="secondary">{s.department}</Badge></TableCell>
                    <TableCell>
                      {s.application ? (
                        <Badge variant={s.application.status === "allocated" ? "success" : "warning"}>{s.application.status}</Badge>
                      ) : (<span className="text-xs text-slate-400">—</span>)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{s.allocatedName || <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle>{editing ? "Edit Student" : "Add Student"}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Registration Number</Label><Input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. 20252025" /></div>
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. IST" /></div>
              <div className="space-y-1.5"><Label>Program</Label><Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="e.g. BSc. Information Science and Technology" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank to keep current" : "Min 6 characters"} /></div>
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
          title="Delete Student"
          description={`Are you sure you want to delete "${deleteTarget?.fullName}" (${deleteTarget?.studentId})? This will also remove their application.`}
          confirmLabel="Delete"
        />
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
      </CardContent>
    </Card>
  );
}
