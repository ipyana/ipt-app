"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, ArrowRight, Search, Loader2 } from "lucide-react";

export default function SuperAdminTransfers() {
  const [transfers, setTransfers] = useState<any[]>([]);
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

  const filtered = transfers.filter((t) => filter === "all" || t.status === filter);
  const pendingCount = transfers.filter((t) => t.status === "pending").length;

  return (
    <AppLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transfer Requests</h2>
            <p className="text-sm text-slate-500 mt-1">{pendingCount} pending</p>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}>{message.text}</div>
        )}

        <div className="flex flex-wrap items-center gap-2">
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
                  <TableHead className="w-40">Actions</TableHead>
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
                      <p className="text-xs text-slate-400">{t.application?.student?.studentId}</p>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t.fromClusterName}</Badge></TableCell>
                    <TableCell><ArrowRight className="h-4 w-4 text-slate-400" /></TableCell>
                    <TableCell><Badge>{t.toClusterName}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{t.reason}</TableCell>
                    <TableCell className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {t.status === "pending" ? <Badge variant="warning">Pending</Badge>
                        : t.status === "approved" ? <Badge variant="success">Approved</Badge>
                        : <Badge variant="danger">Rejected</Badge>}
                    </TableCell>
                    <TableCell>
                      {t.status === "pending" ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => setReviewDialog(t)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Review
                          </Button>
                        </div>
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
                    <span className="text-slate-500">From:</span>
                    <span className="font-medium">{reviewDialog.fromClusterName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">To:</span>
                    <span className="font-medium text-primary-600">{reviewDialog.toClusterName}</span>
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
    </AppLayout>
  );
}
