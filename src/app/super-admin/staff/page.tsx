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
import { Plus, Pencil, Trash2, Move, Users } from "lucide-react";

interface Cluster { id: number; name: string; }
interface StaffMember {
  id: number; name: string; email: string; role: string;
  isActive: boolean; clusterId: number;
  cluster: Cluster;
}

export default function SuperAdminStaff() {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<StaffMember | null>(null);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", clusterId: 0 });
  const [moveClusterId, setMoveClusterId] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  async function load() {
    const [staffRes, clusterRes] = await Promise.all([
      fetch("/api/super-admin/staff").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
    ]);
    setItems(Array.isArray(staffRes) ? staffRes : []);
    setClusters(Array.isArray(clusterRes) ? clusterRes : []);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", clusterId: clusters[0]?.id || 0 });
    setError(""); setDialogOpen(true);
  }

  function openEdit(s: StaffMember) {
    setEditing(s);
    setForm({ name: s.name, email: s.email, password: "", clusterId: s.clusterId });
    setError(""); setDialogOpen(true);
  }

  function openMove(s: StaffMember) {
    setMoveTarget(s);
    setMoveClusterId(s.clusterId);
    setError("");
    setMoveDialogOpen(true);
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body: any = { ...form };
      if (editing) body.id = editing.id;
      if (!body.password) delete body.password;
      const res = await fetch("/api/super-admin/staff", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleMove() {
    if (!moveTarget || !moveClusterId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: moveTarget.id, clusterId: moveClusterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMoveDialogOpen(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/super-admin/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
    setDeleteTarget(null); load();
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manage Staff</h2>
            <p className="text-sm text-slate-500">{items.length} staff members</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Staff</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{s.email}</TableCell>
                    <TableCell><Badge>{s.cluster?.name || "—"}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openMove(s)}><Move className="h-4 w-4 text-amber-600" /></Button>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Assign to Cluster</Label>
              <Select value={form.clusterId || ""} onChange={(e) => setForm({ ...form, clusterId: Number(e.target.value) })}>
                {clusters.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank" : "Min 6 chars"} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </Dialog>

        <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Move className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle>Move Lecturer</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-500 mb-4">
              Move <strong>{moveTarget?.name}</strong> from <strong>{moveTarget?.cluster?.name}</strong> to:
            </p>
            <div className="space-y-1.5"><Label>Destination Cluster</Label>
              <Select value={moveClusterId || ""} onChange={(e) => setMoveClusterId(Number(e.target.value))}>
                {clusters.filter((c) => c.id !== moveTarget?.clusterId).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMove} disabled={saving}>{saving ? "Moving..." : "Move"}</Button>
          </DialogFooter>
        </Dialog>

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Staff"
          description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
          confirmLabel="Delete"
        />
      </div>
    </AppLayout>
  );
}
