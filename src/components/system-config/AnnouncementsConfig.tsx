"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Trash2, Loader2, Paperclip } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  cluster: { id: number; name: string } | null;
  staff: { id: number; name: string } | null;
  _count: { reads: number };
}

export function AnnouncementsConfig() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!confirmDelete) return;
    const res = await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: confirmDelete.id }),
    });
    const data = await res.json();
    setConfirmDelete(null);
    setMessage({ type: data.success ? "success" : "error", text: data.success ? "Announcement deleted" : data.error });
    await load();
  }

  return (
    <div className="space-y-4">
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
                <TableHead>Title</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Facilitator</TableHead>
                <TableHead>Reads</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">No announcements posted yet</TableCell></TableRow>
              ) : items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-slate-400 max-w-[240px] truncate">{a.body}</p>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{a.cluster?.name || "—"}</Badge></TableCell>
                  <TableCell className="text-sm">{a.staff?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{a._count?.reads || 0}</TableCell>
                  <TableCell>
                    {a.attachmentUrl ? (
                      <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                        <Paperclip className="h-3 w-3" /> {a.attachmentName || "File"}
                      </a>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(a)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <Megaphone className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Announcement</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-slate-500">Are you sure you want to delete <strong>{confirmDelete?.title}</strong>? This cannot be undone.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
