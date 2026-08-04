"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Reapp {
  id: number;
  reason: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  fromClusterName: string;
  pref1NewName: string | null;
  pref2NewName: string | null;
  currentAllocName: string | null;
  application?: {
    student?: { fullName?: string; studentId?: string; department?: string; program?: string };
  };
}

export function ReapplicationsConfig() {
  const [items, setItems] = useState<Reapp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Reapp | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/super-admin/transfers");
    const data = await res.json();
    const all = Array.isArray(data) ? data : [];
    setItems(all.filter((t: any) => t.type === "reapplication"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(reapp: Reapp, action: "approve" | "reject") {
    setProcessing(reapp.id);
    setMessage(null);
    try {
      const res = await fetch("/api/super-admin/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reapp.id, action, notes: reviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: `Reapplication ${action === "approve" ? "approved" : "rejected"}` });
      setReviewTarget(null);
      setReviewNotes("");
      load();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setProcessing(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  const filtered = items.filter((t) => filter === "all" || t.status === filter);
  const pendingCount = items.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{message.text}</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">{pendingCount} pending</span>
        {["pending", "approved", "rejected", "all"].map((f) => (
          <Button key={f} variant={filter === f ? "primary" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Requested Clusters</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">No reapplication requests found</TableCell></TableRow>
              ) : filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{t.application?.student?.fullName}</p>
                    <p className="text-xs text-slate-400">{t.application?.student?.studentId} · {t.application?.student?.department}</p>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{t.currentAllocName || t.fromClusterName}</Badge></TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Badge>{t.pref1NewName || "—"}</Badge>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <Badge>{t.pref2NewName || "—"}</Badge>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[180px] truncate">{t.reason}</TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString("en-TZ")}</TableCell>
                  <TableCell>
                    {t.status === "pending" ? <Badge variant="warning">Pending</Badge>
                      : t.status === "approved" ? <Badge variant="success">Approved</Badge>
                      : <Badge variant="danger">Rejected</Badge>}
                  </TableCell>
                  <TableCell>
                    {t.status === "pending" ? (
                      <Button size="sm" onClick={() => { setReviewTarget(t); setReviewNotes(""); }}>Review</Button>
                    ) : (
                      <span className="text-xs text-slate-400">{t.reviewNotes ? t.reviewNotes.slice(0, 30) : "—"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)}>
        <DialogHeader>
          <DialogTitle>Review Reapplication</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-medium">{reviewTarget.application?.student?.fullName} ({reviewTarget.application?.student?.studentId})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current cluster:</span>
                  <span className="font-medium">{reviewTarget.currentAllocName || reviewTarget.fromClusterName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Requested:</span>
                  <span className="font-medium text-primary-600">
                    {reviewTarget.pref1NewName} → {reviewTarget.pref2NewName}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Reason:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{reviewTarget.reason}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Review Notes</Label>
                <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px] dark:bg-slate-900 dark:border-slate-700"
                  placeholder="Optional notes for the student" />
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => reviewTarget && handleAction(reviewTarget, "reject")} disabled={processing === reviewTarget?.id}>
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
          <Button onClick={() => reviewTarget && handleAction(reviewTarget, "approve")} disabled={processing === reviewTarget?.id}>
            <CheckCircle className="h-4 w-4 mr-1" /> Approve
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
