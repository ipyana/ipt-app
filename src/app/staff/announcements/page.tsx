"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Megaphone, Paperclip, Loader2, Send, Trash2 } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  staff: { id: number; name: string };
}

export default function StaffAnnouncements() {
  const [cluster, setCluster] = useState<string>("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setCluster(data.cluster?.name || "");
    setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setPosting(true);
    try {
      if (!title.trim() || !body.trim()) throw new Error("Title and body are required");
      if (file && file.size > 9 * 1024 * 1024) throw new Error("File size must be under 9MB");

      const fd = new FormData();
      fd.append("title", title);
      fd.append("body", body);
      if (file) fd.append("attachment", file);

      const res = await fetch("/api/announcements", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post announcement");

      setTitle(""); setBody(""); setFile(null);
      setSuccess("Announcement posted and emailed to your cluster students.");
      await load();
    } catch (err: any) { setError(err.message); }
    finally { setPosting(false); }
  }

  return (
    <AppLayout role="student">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Cluster Announcements</h2>
          <p className="text-sm text-slate-500 mt-1">
            {cluster ? `Posting to students of ${cluster}` : "No cluster assigned"}
          </p>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary-600" />
              <CardTitle className="text-base">Post New Announcement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePost} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Phase 1 reporting details" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your announcement to cluster students..."
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[120px] dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Attachment (optional, max 9MB)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:file:bg-slate-800"
                  />
                  {file && <Paperclip className="h-4 w-4 text-slate-400" />}
                </div>
                {file && <p className="text-xs text-slate-400">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
              </div>
              <Button type="submit" disabled={posting}>
                {posting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                {posting ? "Posting..." : "Post Announcement"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Posted Announcements</h3>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No announcements yet</p>
          ) : announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-sm text-slate-500 whitespace-pre-wrap">{a.body}</p>
                    <div className="flex items-center gap-3 pt-1">
                      {a.attachmentUrl && (
                        <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
                          <Paperclip className="h-3 w-3" /> {a.attachmentName || "Download"}
                        </a>
                      )}
                      <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                      <Badge variant="secondary" className="text-[10px]">by {a.staff?.name}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
