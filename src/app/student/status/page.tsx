"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Steps } from "@/components/ui/steps";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Clock, Calendar, MapPin, Edit3, FileText, Users,
  CheckCircle, XCircle, AlertTriangle, ArrowRight, Send, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudentStatus() {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [clusters, setClusters] = useState<Record<number, any>>({});
  const [transferDialog, setTransferDialog] = useState(false);
  const [eligibleClusters, setEligibleClusters] = useState<any[]>([]);
  const [transferForm, setTransferForm] = useState({ toClusterId: 0, reason: "" });
  const [transferError, setTransferError] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [c, a] = await Promise.all([
      fetch("/api/clusters").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ]);
    const map: Record<number, any> = {};
    (Array.isArray(c) ? c : []).forEach((cl: any) => (map[cl.id] = cl));
    setClusters(map);
    if (a && a.id) setApplication(a);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openTransferDialog() {
    setTransferError("");
    setTransferSuccess("");
    setTransferForm({ toClusterId: 0, reason: "" });
    try {
      const res = await fetch("/api/applications/transfer");
      const data = await res.json();
      setEligibleClusters(Array.isArray(data) ? data : []);
      setTransferDialog(true);
    } catch {
      setTransferError("Failed to load eligible clusters");
    }
  }

  async function handleTransferSubmit() {
    setTransferError(""); setTransferSuccess(""); setTransferSaving(true);
    try {
      const res = await fetch("/api/applications/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTransferSuccess("Transfer request submitted!");
      setTransferDialog(false);
      load();
    } catch (e: any) { setTransferError(e.message); }
    finally { setTransferSaving(false); }
  }

  const c1 = application?.allocations?.find((a: any) => a.phase?.phaseNumber === 1)
    ? clusters[application.allocations.find((a: any) => a.phase?.phaseNumber === 1)?.clusterId]
    : null;
  const c2 = application?.allocations?.find((a: any) => a.phase?.phaseNumber === 2)
    ? clusters[application.allocations.find((a: any) => a.phase?.phaseNumber === 2)?.clusterId]
    : null;

  const phase1Alloc = application?.allocations?.find((a: any) => a.phase?.phaseNumber === 1);
  const phase2Alloc = application?.allocations?.find((a: any) => a.phase?.phaseNumber === 2);
  const p1Dates = phase1Alloc?.phase ? { start: phase1Alloc.phase.startDate, end: phase1Alloc.phase.endDate } : null;
  const p2Dates = phase2Alloc?.phase ? { start: phase2Alloc.phase.startDate, end: phase2Alloc.phase.endDate } : null;

  const pendingTransfer = application?.transferRequests?.find((t: any) => t.status === "pending");
  const lastTransfer = application?.transferRequests?.[application.transferRequests.length - 1];

  if (loading) {
    return (
      <AppLayout role="student">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!application) {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Application Found</h2>
          <p className="text-sm text-slate-500 mt-2">Submit your cluster preferences to get started.</p>
          <Button className="mt-6" onClick={() => router.push("/student/apply")}>Go to Application</Button>
        </div>
      </AppLayout>
    );
  }

  const statusIndex = application.status === "allocated" ? 2 : application.status === "pending" ? 1 : 0;
  const allocatedClusterData = application.allocatedCluster ? clusters[application.allocatedCluster] : null;

  const isWithinTransferWindow = p1Dates && (() => {
    const now = new Date();
    const windowEnd = new Date(p1Dates.start);
    windowEnd.setDate(windowEnd.getDate() + 7);
    return now >= new Date(p1Dates.start) && now <= windowEnd;
  })();

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  }

  function formatDateFull(d: string) {
    return new Date(d).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <AppLayout role="student">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Application</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            Submitted {formatDateFull(application.submissionDate)}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Steps steps={[{ label: "Submitted" }, { label: "Reviewing" }, { label: "Allocated" }]} current={statusIndex} />
          </CardContent>
        </Card>

        {application.status === "allocated" && p1Dates && p2Dates && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                <CardTitle className="text-base">IPT Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-primary-500 rounded-l-full" />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{formatDate(p1Dates.start)}</span>
                  <span className="font-medium text-primary-600">Phase 1</span>
                  <span>{formatDate(p1Dates.end)}</span>
                  <span className="font-medium text-emerald-600">Phase 2</span>
                  <span>{formatDate(p2Dates.end)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-900/10 p-3 text-center">
                  <p className="text-xs text-primary-600 font-medium">Phase 1</p>
                  <p className="text-lg font-bold text-primary-700 dark:text-primary-400">5 weeks</p>
                  <p className="text-xs text-slate-400">{formatDate(p1Dates.start)} – {formatDate(p1Dates.end)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 p-3 text-center">
                  <p className="text-xs text-emerald-600 font-medium">Phase 2</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">5 weeks</p>
                  <p className="text-xs text-slate-400">{formatDate(p2Dates.start)} – {formatDate(p2Dates.end)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {c1 && p1Dates && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-l-4 border-l-primary-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>Phase 1</Badge>
                      <Badge variant="success">Currently here</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c1.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c1.description}</p>
                    <div className="space-y-1.5 mt-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {c1.location}</div>
                      <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /> {c1.staff?.map((s: any) => s.name).join(", ")}</div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> {formatDateFull(p1Dates.start)} – {formatDateFull(p1Dates.end)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {c2 && p2Dates && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Phase 2</Badge>
                      <Badge variant="warning">Starts {formatDate(p2Dates.start)}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c2.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c2.description}</p>
                    <div className="space-y-1.5 mt-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {c2.location}</div>
                      <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /> {c2.staff?.map((s: any) => s.name).join(", ")}</div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> {formatDateFull(p2Dates.start)} – {formatDateFull(p2Dates.end)}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                      <ArrowRight className="h-4 w-4" />
                      <span>Move to this cluster on <strong>{formatDateFull(p2Dates.start)}</strong></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-3">
          {application.status === "allocated" && isWithinTransferWindow && !pendingTransfer && (
            <Button onClick={openTransferDialog} variant="outline" className="w-full">
              <Send className="h-4 w-4" /> Request Transfer
            </Button>
          )}

          {pendingTransfer && (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-amber-600 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Transfer Request Pending</p>
                  <p className="text-xs text-slate-500">Request to move to {clusters[pendingTransfer.toClusterId]?.name || "another cluster"} — awaiting review</p>
                </div>
              </CardContent>
            </Card>
          )}

          {lastTransfer?.status === "approved" && (
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Transfer Approved</p>
                  <p className="text-xs text-slate-500">Moved to {clusters[lastTransfer.toClusterId]?.name}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {lastTransfer?.status === "rejected" && (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Transfer Not Approved</p>
                  <p className="text-xs text-slate-500">{lastTransfer.reviewNotes || "No reason provided"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {application.status === "pending" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => router.push("/student/apply")}>
                <Edit3 className="h-4 w-4" /> Modify Preferences
              </Button>
            </div>
          )}
        </div>

        <Dialog open={transferDialog} onClose={() => setTransferDialog(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Send className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>Request Transfer</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-500 mb-4">
              Current cluster: <strong>{allocatedClusterData?.name}</strong>
            </p>
            <div className="space-y-1.5 mb-4">
              <Label>Select new cluster</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {eligibleClusters.length === 0 ? (
                  <p className="text-sm text-slate-400">No eligible clusters with available slots</p>
                ) : eligibleClusters.map((c: any) => (
                  <button key={c.id} onClick={() => setTransferForm({ ...transferForm, toClusterId: c.id })}
                    className={`w-full text-left rounded-lg border-2 p-3 text-sm transition-all ${
                      transferForm.toClusterId === c.id
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-slate-200 hover:border-primary-200 dark:border-slate-700"
                    }`}>
                    <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.location} · {c.staff?.map((s: any) => s.name).join(", ")}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason for transfer</Label>
              <textarea value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-slate-900 dark:border-slate-700"
                placeholder="Explain why you want to transfer (min 10 characters)" />
            </div>
            {transferError && <p className="text-sm text-red-600 mt-2">{transferError}</p>}
            {transferSuccess && <p className="text-sm text-emerald-600 mt-2">{transferSuccess}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialog(false)}>Cancel</Button>
            <Button onClick={handleTransferSubmit} disabled={transferSaving || !transferForm.toClusterId || transferForm.reason.length < 10}>
              {transferSaving ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </AppLayout>
  );
}
