"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

interface AdminUser {
  id: number; username: string; email: string; role: string; createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "coordinator", label: "Coordinator" },
  { value: "admin", label: "Admin" },
];

export default function SuperAdminAdmins() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "admin" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  async function load() {
    const res = await fetch("/api/super-admin/admins");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ username: "", email: "", password: "", role: "admin" });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(u: AdminUser) {
    setEditing(u);
    setForm({ username: u.username, email: u.email, password: "", role: u.role });
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body: any = { ...form };
      if (editing) body.id = editing.id;
      if (!body.password) delete body.password;
      const res = await fetch("/api/super-admin/admins", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/super-admin/admins", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
    setDeleteTarget(null); load();
  }

  const roleBadge: Record<string, string> = {
    super_admin: "destructive", coordinator: "warning", admin: "secondary",
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manage Admins</h2>
            <p className="text-sm text-slate-500">{items.length} accounts</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Admin</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="text-sm text-slate-500">{u.email}</TableCell>
                    <TableCell><Badge variant={roleBadge[u.role] as any}>{u.role.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <DialogTitle>{editing ? "Edit Admin" : "Add Admin"}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLE_OPTIONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank" : "Min 6 chars"} /></div>
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
          title="Delete Admin"
          description={`Delete "${deleteTarget?.username}"? This cannot be undone.`}
          confirmLabel="Delete"
        />
      </div>
    </AppLayout>
  );
}
