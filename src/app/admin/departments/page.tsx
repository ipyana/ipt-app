"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Download, Building2, BookOpen } from "lucide-react";

interface Department {
  id: number; name: string; abbreviation: string;
  programs: { id: number; name: string }[];
}

export default function AdminDepartments() {
  const [items, setItems] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [viewTarget, setViewTarget] = useState<Department | null>(null);
  const [bulkMsg, setBulkMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/departments");
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", abbreviation: "" });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setForm({ name: d.name, abbreviation: d.abbreviation });
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const res = await fetch("/api/admin/departments", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/admin/departments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
    setDeleteTarget(null); load();
  }

  async function handleBulkUpload(file: File) {
    setBulkMsg("Uploading...");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/admin/departments/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setBulkMsg(`Done! Departments: ${data.summary?.departments || 0}, Programs: ${data.summary?.programs || 0}`);
      load();
    } catch (e: any) { setBulkMsg(e.message); }
  }

  function downloadTemplate() {
    const csv = `Department_Name,Abbreviation,Program_Name\nInformation Science and Technology,IST,BSc. Information Science and Technology\nInformation Science and Technology,IST,BSc. Business Information Systems\nComputer Science and Engineering,CSE,BSc. Computer Science and Engineering\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "departments-template.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function uploadFile() {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".csv";
    input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleBulkUpload(f); };
    input.click();
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Departments</h2>
            <p className="text-sm text-slate-500">{items.length} departments</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Department</Button>
        </div>

        {bulkMsg && <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300">{bulkMsg}</div>}

        <Card className="border-dashed">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Bulk Upload Departments & Programs</p>
              <p className="text-xs text-slate-400">CSV format: Department_Name, Abbreviation, Program_Name</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-3 w-3 mr-1" /> Template</Button>
              <Button size="sm" onClick={uploadFile}><Upload className="h-3 w-3 mr-1" /> Upload CSV</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setViewTarget(d)}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell><Badge>{d.abbreviation}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-500">{d.programs.length} programs</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(d); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20">
                <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5"><Label>Department Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Information Science and Technology" /></div>
            <div className="space-y-1.5"><Label>Abbreviation</Label><Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="e.g. IST" /></div>
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
          title="Delete Department"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all associated programs.`}
          confirmLabel="Delete"
        />

        <Dialog open={!!viewTarget} onClose={() => setViewTarget(null)}>
          {viewTarget && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20 shrink-0">
                    <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <DialogTitle>{viewTarget.name}</DialogTitle>
                    <Badge className="mt-1">{viewTarget.abbreviation}</Badge>
                  </div>
                </div>
              </DialogHeader>
              <DialogBody>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-teal-50 dark:bg-teal-900/10 p-4 text-center">
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{viewTarget.programs.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Programs</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/10 p-4 text-center">
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{viewTarget.abbreviation}</p>
                    <p className="text-xs text-slate-500 mt-1">Abbreviation</p>
                  </div>
                </div>

                {viewTarget.programs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Programs under this Department</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {viewTarget.programs.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
                          <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
                        </div>
                      ))}
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
