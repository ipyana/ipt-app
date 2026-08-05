"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { ArrowRightLeft, Loader2, RefreshCw } from "lucide-react";

interface Transfer {
  id: number;
  reason: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  staff: { id: number; name: string; email: string; department: string | null };
  fromCluster: { id: number; name: string };
  toCluster: { id: number; name: string };
}

export function StaffTransfersConfig() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Transfer | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/staff-transfers");
    if (res.status === 403) {
      setMessage({ type: "error", text: "Only the Coordinator or Super Admin can review staff transfers." });
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleReview() {
    if (!reviewTarget) return;
    setBusy(true);
    const res = await fetch("/api/admin/staff-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewTarget.id, action: reviewAction, notes: reviewNotes }),
    });
    const data = await res.json();
    setBusy(false);
    setReviewTarget(null); setReviewNotes("");
    setMessage({ type: data.success ? "success" : "error", text: data.message || data.error || "Failed" });
    await load();
  }

  async function handleReactivate(id: number) {
    if (!confirm("Reactivate this rejected transfer request? It will be reopened for review and the facilitator can be approved again.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/staff-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reactivate" }),
    });
    const data = await res.json();
    setBusy(false);
    setMessage({ type: data.success ? "success" : "error", text: data.message || data.error || "Failed" });
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
                <TableHead>Facilitator</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">No transfer requests</TableCell></TableRow>
              ) : items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{t.staff?.name}</p>
                    <p className="text-xs text-slate-400">{t.staff?.email}</p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Badge variant="secondary">{t.fromCluster?.name}</Badge>
                      <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                      <Badge>{t.toCluster?.name}</Badge>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{t.reason}</TableCell>
                  <TableCell>
                    {t.status === "pending" ? <Badge variant="warning">Pending</Badge>
                      : t.status === "approved" ? <Badge variant="success">Approved</Badge>
                      : <Badge variant="danger">Rejected</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString("en-TZ")}</TableCell>
                  <TableCell>
                    {t.status === "pending" ? (
                      <Button size="sm" onClick={() => { setReviewTarget(t); setReviewAction("approve"); setReviewNotes(""); }}>
                        Review
                      </Button>
                    ) : t.status === "rejected" ? (
                      <Button size="sm" variant="outline" onClick={() => handleReactivate(t.id)}><RefreshCw className="h-3 w-3" /> Reactivate</Button>
                    ) : <span className="text-xs text-slate-400">{t.reviewNotes || "—"}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
              <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
            </div>
            <DialogTitle>Review Transfer — {reviewTarget?.staff?.name}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              <strong>{reviewTarget?.fromCluster?.name}</strong> → <strong>{reviewTarget?.toCluster?.name}</strong>
            </p>
            <p className="text-sm text-slate-500">Reason: {reviewTarget?.reason}</p>
            <div className="flex gap-2">
              <Button variant={reviewAction === "approve" ? "primary" : "outline"} size="sm" onClick={() => setReviewAction("approve")}>Approve</Button>
              <Button variant={reviewAction === "reject" ? "destructive" : "outline"} size="sm" onClick={() => setReviewAction("reject")}>Reject</Button>
            </div>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewAction === "reject" ? "Reason for rejection..." : "Note (optional)"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[70px] dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
          <Button onClick={handleReview} disabled={busy} variant={reviewAction === "reject" ? "destructive" : "primary"}>
            {busy ? "Saving..." : reviewAction === "approve" ? "Approve Transfer" : "Reject Transfer"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
