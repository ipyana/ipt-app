"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";

interface Location {
  id: number;
  name: string;
  createdAt: string;
  _count?: { clusters: number };
}

export default function AdminLocations() {
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/locations");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setName("");
    setError("");
    setDialogOpen(true);
  }

  function openEdit(l: Location) {
    setEditing(l);
    setName(l.name);
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body: any = { name };
      if (editing) body.id = editing.id;
      const res = await fetch("/api/admin/locations", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDialogOpen(false);
      setMessage({ type: "success", text: `Location ${editing ? "updated" : "created"}` });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch("/api/admin/locations", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    const data = await res.json();
    setDeleteTarget(null);
    setMessage({ type: data.success ? "success" : "error", text: data.success ? "Location deleted" : data.error });
    load();
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Cluster Locations</h2>
            <p className="text-sm text-slate-500 mt-1">Manage reusable locations that can be assigned to clusters</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> New Location</Button>
        </div>

        {message && (
          <div className={`rounded-lg border p-3 text-sm ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>{message.text}</div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Clusters</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-sm text-slate-400">No locations yet</TableCell></TableRow>
                ) : items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                        <MapPin className="h-4 w-4 text-slate-400" /> {l.name}
                      </span>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{l._count?.clusters || 0}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-400">{new Date(l.createdAt).toLocaleDateString("en-TZ")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(l)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <DialogTitle>{editing ? "Edit Location" : "New Location"}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5">
              <Label>Location Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A-B 11, COMP-LAB I, A110" />
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </Dialog>

        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Clusters referencing it will keep their current location text but no longer link to this location.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </Dialog>
      </div>
    </AppLayout>
  );
}
