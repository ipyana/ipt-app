"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Trash2, Loader2, Paperclip, Plus } from "lucide-react";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";

interface Announcement {
  id: number;
  title: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  audience: string;
  createdAt: string;
  cluster: { id: number; name: string } | null;
  staff: { id: number; name: string } | null;
  _count: { reads: number; staffReads: number };
}

interface Cluster { id: number; name: string }

const AUDIENCE_LABELS: Record<string, string> = {
  students: "Students",
  staff: "Staff",
  all: "All",
};

export function AnnouncementsConfig() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postAudience, setPostAudience] = useState("students");
  const [postCluster, setPostCluster] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postError, setPostError] = useState("");
  const pagination = usePagination(items, 25);
  const pageItems = pagination.pageItems;
  const [posting, setPosting] = useState(false);

  async function load() {
    const [annRes, clRes] = await Promise.all([
      fetch("/api/admin/announcements").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
    ]);
    setItems(Array.isArray(annRes) ? annRes : []);
    setClusters(Array.isArray(clRes) ? clRes : []);
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

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setPostError("");
    if (!postTitle.trim() || !postBody.trim()) { setPostError("Title and message are required"); return; }
    if (postAudience === "students" && !postCluster) { setPostError("Select a cluster when targeting students"); return; }
    if (postFile && postFile.size > 9 * 1024 * 1024) { setPostError("File size must be under 9MB"); return; }
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("title", postTitle);
      fd.append("body", postBody);
      fd.append("audience", postAudience);
      if (postCluster) fd.append("clusterId", postCluster);
      if (postFile) fd.append("attachment", postFile);

      const res = await fetch("/api/admin/announcements", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post announcement");

      setPostOpen(false);
      setPostTitle(""); setPostBody(""); setPostAudience("students"); setPostCluster(""); setPostFile(null);
      setMessage({ type: "success", text: "Announcement posted" });
      await load();
    } catch (e: any) {
      setPostError(e.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{items.length} announcements</p>
        </div>
        <Button size="sm" onClick={() => setPostOpen(true)}><Plus className="h-3.5 w-3.5" /> Post Announcement</Button>
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
                <TableHead>Title</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Reads</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-slate-400">No announcements posted yet</TableCell></TableRow>
              ) : pageItems.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-slate-400 max-w-[240px] truncate">{a.body}</p>
                  </TableCell>
                  <TableCell><Badge variant={a.audience === "all" ? "success" : a.audience === "staff" ? "warning" : "secondary"}>{AUDIENCE_LABELS[a.audience] || a.audience}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{a.cluster?.name || "All"}</Badge></TableCell>
                  <TableCell className="text-sm">{a.staff?.name || "Admin"}</TableCell>
                  <TableCell className="text-sm">{a.audience === "staff" ? a._count?.staffReads || 0 : a._count?.reads || 0}</TableCell>
                  <TableCell>
                    {a.attachmentUrl ? (
                      <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                        <Paperclip className="h-3 w-3" /> {a.attachmentName || "File"}
                      </a>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString("en-TZ")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(a)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.changePageSize}
      />

      <Dialog open={postOpen} onClose={() => setPostOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Megaphone className="h-5 w-5 text-primary-600" />
            </div>
            <DialogTitle>Post Announcement</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <form id="announcement-post" onSubmit={handlePost} className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="e.g. Phase 1 reporting details" required /></div>
            <div className="space-y-1.5"><Label>Message</Label><textarea value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="Announcement message..." required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px] dark:bg-slate-900 dark:border-slate-700" /></div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <select value={postAudience} onChange={(e) => setPostAudience(e.target.value)} className="flex h-9 w-full rounded-md border border-border bg-panel px-3 py-1.5 text-sm">
                <option value="students">Students</option>
                <option value="staff">Staff / Facilitators</option>
                <option value="all">All (Students & Staff)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Cluster {postAudience !== "students" && <span className="text-xs text-slate-400">(optional)</span>}</Label>
              <select value={postCluster} onChange={(e) => setPostCluster(e.target.value)} className="flex h-9 w-full rounded-md border border-border bg-panel px-3 py-1.5 text-sm">
                <option value="">{postAudience === "students" ? "Select a cluster..." : "All clusters"}</option>
                {clusters.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Attachment (optional)</Label>
              <input type="file" onChange={(e) => setPostFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-600" />
            </div>
            {postError && <p className="text-sm text-red-600">{postError}</p>}
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
          <Button type="submit" form="announcement-post" disabled={posting}>{posting ? "Posting..." : "Post Announcement"}</Button>
        </DialogFooter>
      </Dialog>

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
