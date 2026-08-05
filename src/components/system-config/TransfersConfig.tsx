"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";

interface Transfer {
  id: number;
  type: string;
  reason: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  fromClusterName: string;
  toClusterName: string | null;
  pref1NewName: string | null;
  pref2NewName: string | null;
  currentAllocName: string | null;
  oldPref1Name: string | null;
  oldPref2Name: string | null;
  application?: {
    clusterPref1?: number;
    clusterPref2?: number;
    student?: { fullName?: string; studentId?: string; department?: string; program?: string };
  };
}

export function TransfersConfig() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState<number | null>(null);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/super-admin/transfers");
    const data = await res.json();
    setTransfers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(transfer: any, action: "approve" | "reject") {
    setProcessing(transfer.id);
    setMessage(null);
    try {
      const res = await fetch("/api/super-admin/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: transfer.id, action, notes: reviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: `Transfer ${action === "approve" ? "approved" : "rejected"}` });
      setReviewDialog(null);
      setReviewNotes("");
      load();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setProcessing(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  const transfersOnly = transfers.filter((t) => t.type === "transfer");
  const filtered = transfersOnly.filter((t) => filter === "all" || t.status === filter);
  const pendingCount = transfersOnly.filter((t) => t.status === "pending").length;

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
                <TableHead>From</TableHead>
                <TableHead></TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-slate-400">No transfer requests found</TableCell></TableRow>
              ) : filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{t.application?.student?.fullName}</p>
                    <p className="text-xs text-slate-400">{t.application?.student?.studentId} · {t.application?.student?.department}</p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Badge variant="secondary">{t.oldPref1Name || t.currentAllocName || t.fromClusterName}</Badge>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <Badge variant="secondary">{t.oldPref2Name || "—"}</Badge>
                    </span>
                  </TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-slate-400" /></TableCell>
                  <TableCell>
                    {t.pref1NewName && t.pref2NewName ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Badge>{t.pref1NewName}</Badge>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <Badge>{t.pref2NewName}</Badge>
                      </span>
                    ) : (
                      <Badge>{t.toClusterName || "—"}</Badge>
                    )}
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
                      <Button size="sm" onClick={() => { setReviewDialog(t); setReviewNotes(""); }}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Review
                      </Button>
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

      <Dialog open={!!reviewDialog} onClose={() => setReviewDialog(null)}>
        <DialogHeader>
          <DialogTitle>Review Transfer Request</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {reviewDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-medium">{reviewDialog.application?.student?.fullName} ({reviewDialog.application?.student?.studentId})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-medium">{reviewDialog.application?.student?.program}</span>
                </div>
                {reviewDialog.pref1NewName && reviewDialog.pref2NewName ? (
                  <>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Previous selections</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">1st:</span>
                        <span className="font-medium">{reviewDialog.oldPref1Name || reviewDialog.fromClusterName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">2nd:</span>
                        <span className="font-medium">{reviewDialog.oldPref2Name || "—"}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 p-3 space-y-1">
                      <p className="text-xs font-semibold text-primary-600 uppercase">New selections (requested)</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">1st:</span>
                        <span className="font-medium text-primary-700 dark:text-primary-400">{reviewDialog.pref1NewName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">2nd:</span>
                        <span className="font-medium text-primary-700 dark:text-primary-400">{reviewDialog.pref2NewName}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Current cluster:</span>
                    <span className="font-medium">{reviewDialog.currentAllocName || reviewDialog.fromClusterName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Requested target:</span>
                  <span className="font-medium text-primary-600">
                    {reviewDialog.pref1NewName && reviewDialog.pref2NewName
                      ? `${reviewDialog.pref1NewName} → ${reviewDialog.pref2NewName}`
                      : reviewDialog.toClusterName || "—"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Reason:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{reviewDialog.reason}</p>
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
          <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => handleAction(reviewDialog, "reject")} disabled={processing === reviewDialog?.id}>
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
          <Button onClick={() => handleAction(reviewDialog, "approve")} disabled={processing === reviewDialog?.id}>
            <CheckCircle className="h-4 w-4 mr-1" /> Approve
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
