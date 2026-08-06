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
import { Plus, Pencil, Trash2, Move, Users, RefreshCw, ClipboardCheck } from "lucide-react";
import { DEPARTMENT_ABBREVIATIONS } from "@/lib/departments";
import { StaffApproveDialog, StaffForReview } from "@/components/StaffApproveDialog";
import { useBulkSelection } from "@/lib/useBulkSelection";
import { BulkDeleteDialog } from "@/components/BulkDeleteDialog";

interface Cluster { id: number; name: string; }
interface StaffMember {
  id: number; name: string; email: string; phone: string | null; role: string;
  isActive: boolean; status: string; department: string | null; clusterId: number;
  cluster: Cluster;
}

export default function SuperAdminStaff() {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<StaffMember | null>(null);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", password: "", clusterId: 0 });
  const [moveClusterId, setMoveClusterId] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [reviewTarget, setReviewTarget] = useState<StaffMember | null>(null);
  const [reviewRequiresPassword, setReviewRequiresPassword] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const bulk = useBulkSelection(items);

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
    setForm({ name: "", email: "", phone: "", department: "", password: "", clusterId: clusters[0]?.id || 0 });
    setError(""); setDialogOpen(true);
  }

  function openEdit(s: StaffMember) {
    setEditing(s);
    setForm({ name: s.name, email: s.email, phone: s.phone || "", department: s.department || "", password: "", clusterId: s.clusterId });
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

  async function handleBulkDelete() {
    const res = await fetch("/api/super-admin/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(bulk.selected) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete");
    const count = data.deleted ?? bulk.selected.size;
    bulk.clear();
    setBulkOpen(false);
    setBulkMsg({ type: "success", text: `Deleted ${count} staff member${count !== 1 ? "s" : ""}` });
    load();
  }

  async function handleApprove(id: number) {
    await fetch("/api/super-admin/staff", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "approve" }) });
    load();
  }

  function openReview(s: StaffMember) {
    setReviewRequiresPassword(s.status !== "pending_approval");
    setReviewTarget(s);
  }

  async function handleApproveWithPassword(id: number, temporaryPassword?: string) {
    const body: any = { id, action: "approve" };
    if (temporaryPassword) body.temporaryPassword = temporaryPassword;
    const res = await fetch("/api/super-admin/staff", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to approve");
    setReviewTarget(null);
    load();
  }

  async function handleResendActivation(id: number) {
    await fetch("/api/super-admin/staff", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "resend-activation" }) });
    load();
  }

  async function handleForceActivate(id: number) {
    await fetch("/api/super-admin/staff", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "force-activate" }) });
    load();
  }

  async function handleReject(id: number) {
    await fetch("/api/super-admin/staff", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "reject", reason: "Registration not approved" }) });
    load();
  }

  return (
    <AppLayout role="super_admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manage Staff</h2>
            <p className="text-sm text-slate-500">{items.length} staff members</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Staff</Button>
        </div>

        {bulkMsg && (
          <div className={`rounded-lg border px-3 py-2 text-sm ${
            bulkMsg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>{bulkMsg.text}</div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} className="h-4 w-4 accent-primary-600" title="Select all" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">No facilitators registered yet. Facilitators can self-register, or you can add one.</TableCell></TableRow>
                ) : items.map((s) => (
                  <TableRow key={s.id} className={bulk.selected.has(s.id) ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={bulk.selected.has(s.id)}
                        onChange={() => bulk.toggleOne(s.id)}
                        className="h-4 w-4 accent-primary-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{s.email}</TableCell>
                    <TableCell>{s.department ? <Badge variant="secondary">{s.department}</Badge> : <span className="text-sm text-slate-400">—</span>}</TableCell>
                    <TableCell><Badge>{s.cluster?.name || "—"}</Badge></TableCell>
                    <TableCell>
                      {s.status === "pending_activation" ? <Badge variant="warning">Awaiting Activation</Badge>
                        : s.status === "pending_approval" ? <Badge variant="warning">Pending</Badge>
                        : s.status === "rejected" ? <Badge variant="danger">Rejected</Badge>
                        : <Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {s.status === "pending_approval" && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => handleApprove(s.id)}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(s.id)}>Reject</Button>
                          </>
                        )}
                        {s.status === "pending_activation" && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => openReview(s)}><ClipboardCheck className="h-3 w-3" /> Review</Button>
                            <Button size="sm" variant="outline" onClick={() => handleResendActivation(s.id)}><RefreshCw className="h-3 w-3" /> Resend</Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(s.id)}>Reject</Button>
                          </>
                        )}
                        {s.status === "active" && !s.isActive && (
                          <Button size="sm" variant="outline" onClick={() => handleForceActivate(s.id)}><RefreshCw className="h-3 w-3" /> Reactivate</Button>
                        )}
                        {s.status === "rejected" && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => openReview(s)}><ClipboardCheck className="h-3 w-3" /> Review</Button>
                            <Button size="sm" variant="outline" onClick={() => handleForceActivate(s.id)}><RefreshCw className="h-3 w-3" /> Resend Link</Button>
                          </>
                        )}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+255..." /></div>
              <div className="space-y-1.5"><Label>Department</Label>
                <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select...</option>
                  {DEPARTMENT_ABBREVIATIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Assign to Cluster</Label>
              <Select value={form.clusterId || ""} onChange={(e) => setForm({ ...form, clusterId: Number(e.target.value) })}>
                <option value="">Select cluster...</option>
                {clusters.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </div>
            {!editing && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">An activation email with a link to set a password will be sent to the facilitator.</p>
            )}
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

        <BulkDeleteDialog
          open={bulkOpen}
          count={bulk.selected.size}
          label="staff member"
          onClose={() => setBulkOpen(false)}
          onConfirm={handleBulkDelete}
        />

        <StaffApproveDialog
          open={!!reviewTarget}
          staff={reviewTarget as StaffForReview}
          requirePassword={reviewRequiresPassword}
          onClose={() => setReviewTarget(null)}
          onApprove={handleApproveWithPassword}
        />

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
