"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { useBulkSelection } from "@/lib/useBulkSelection";
import { BulkDeleteDialog } from "@/components/BulkDeleteDialog";

interface Dept { id: number; name: string; abbreviation: string; }
interface Program { id: number; name: string; departmentId: number; department: Dept; }

export default function AdminPrograms() {
  const [items, setItems] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [form, setForm] = useState({ name: "", departmentId: 0 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const bulk = useBulkSelection(items);

  async function load() {
    const [progs, depts] = await Promise.all([
      fetch("/api/admin/programs").then((r) => r.json()),
      fetch("/api/admin/departments").then((r) => r.json()),
    ]);
    setItems(Array.isArray(progs) ? progs : []);
    setDepartments(Array.isArray(depts) ? depts : []);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", departmentId: 0 });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(p: Program) {
    setEditing(p);
    setForm({ name: p.name, departmentId: p.departmentId });
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const res = await fetch("/api/admin/programs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/admin/programs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
    setDeleteTarget(null); load();
  }

  async function handleBulkDelete() {
    const res = await fetch("/api/admin/programs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(bulk.selected) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete");
    const count = data.deleted ?? bulk.selected.size;
    bulk.clear();
    setBulkOpen(false);
    setBulkMsg({ type: "success", text: `Deleted ${count} program${count !== 1 ? "s" : ""}` });
    load();
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Programs / Courses</h2>
            <p className="text-sm text-slate-500">{items.length} programs</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Program</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} className="h-4 w-4 accent-primary-600" title="Select all" />
                  </TableHead>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id} className={bulk.selected.has(p.id) ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={bulk.selected.has(p.id)}
                        onChange={() => bulk.toggleOne(p.id)}
                        className="h-4 w-4 accent-primary-600"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge>{p.department?.abbreviation}</Badge> <span className="text-sm text-slate-500 ml-2">{p.department?.name}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {bulkMsg && (
          <div className={`rounded-lg border px-3 py-2 text-sm ${
            bulkMsg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>{bulkMsg.text}</div>
        )}

        {bulk.someSelected && (
          <div className="sticky bottom-4 z-30 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-600 px-4 py-2.5 text-white shadow-lg">
            <p className="text-sm font-medium">{bulk.selected.size} selected</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20" onClick={bulk.clear}>
                Clear
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected
              </Button>
            </div>
          </div>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle>{editing ? "Edit Program" : "Add Program"}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5"><Label>Program Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. BSc. Computer Science and Engineering" /></div>
            <div className="space-y-1.5"><Label>Department</Label>
              <Select value={form.departmentId || ""} onChange={(e) => setForm({ ...form, departmentId: Number(e.target.value) })}>
                <option value="">Select department</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.abbreviation})</option>))}
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </Dialog>

        <BulkDeleteDialog
          open={bulkOpen}
          count={bulk.selected.size}
          label="program"
          onClose={() => setBulkOpen(false)}
          onConfirm={handleBulkDelete}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Program"
          description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
          confirmLabel="Delete"
        />
      </div>
    </AppLayout>
  );
}
