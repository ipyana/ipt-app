"use client";

import { useState, useRef } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, Send, Loader2 } from "lucide-react";

const BATCH_SIZE = 50;

interface Props {
  open: boolean;
  ids: number[];
  onClose: () => void;
  onDone: (failedIds: number[]) => void;
}

type Phase = "confirm" | "running" | "done";

export function ResendProgressDialog({ open, ids, onClose, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [sent, setSent] = useState(0);
  const [failed, setFailed] = useState(0);
  const [current, setCurrent] = useState(0);
  const [failedIds, setFailedIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const abortRef = useRef(false);

  const total = ids.length;

  function reset() {
    setPhase("confirm");
    setSent(0); setFailed(0); setCurrent(0); setFailedIds([]); setError("");
    abortRef.current = false;
  }

  async function start() {
    setPhase("running");
    setSent(0); setFailed(0); setCurrent(0); setFailedIds([]); setError("");
    const newFailed: number[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      if (abortRef.current) break;
      const batch = ids.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("/api/admin/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resend", ids: batch }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Resend failed");
        const results: { id: number; ok: boolean }[] = data.results || [];
        for (const r of results) {
          if (r.ok) setSent((s) => s + 1);
          else { setFailed((f) => f + 1); newFailed.push(r.id); }
        }
        setCurrent(Math.min(i + batch.length, ids.length));
      } catch (e: any) {
        setError(e.message || "A batch failed — try again");
        // Treat the whole batch as failed so it can be retried.
        for (const id of batch) newFailed.push(id);
        setFailed((f) => f + batch.length);
        setCurrent(Math.min(i + batch.length, ids.length));
      }
    }

    setFailedIds(newFailed);
    setPhase("done");
  }

  function handleClose() {
    if (phase === "running") { abortRef.current = true; return; }
    onClose();
    reset();
  }

  function handleResendFailed() {
    onDone(failedIds);
    reset();
  }

  const pct = total ? Math.round((current / total) * 100) : 0;

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Send className="h-5 w-5 text-primary-600" />
          </div>
          <DialogTitle>Resend Emails</DialogTitle>
        </div>
      </DialogHeader>
      <DialogBody>
        {phase === "confirm" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You are about to resend <strong>{total}</strong> email{total !== 1 ? "s" : ""}.
            </p>
            <p className="text-sm text-slate-500">
              Account-credential and activation emails will regenerate fresh temporary passwords/links so they are always accepted. Other emails are resent as-is.
            </p>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
              This will run in batches of {BATCH_SIZE}. You can close the dialog to stop after the current batch.
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Sending…</span>
              <span className="text-slate-500">{current}/{total} ({pct}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10">
                <p className="text-xl font-bold text-emerald-600">{sent}</p>
                <p className="text-xs text-slate-500">Sent</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/10">
                <p className="text-xl font-bold text-red-600">{failed}</p>
                <p className="text-xs text-slate-500">Failed</p>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/10">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600" />
                <p className="text-2xl font-bold text-emerald-600 mt-1">{sent}</p>
                <p className="text-xs text-slate-500">Sent</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
                <XCircle className="h-6 w-6 mx-auto text-red-600" />
                <p className="text-2xl font-bold text-red-600 mt-1">{failed}</p>
                <p className="text-xs text-slate-500">Failed</p>
              </div>
            </div>
            {failed > 0 && (
              <p className="text-sm text-slate-500">
                Select all again or press <strong>Resend Failed</strong> below to retry the {failed} that didn&apos;t go through.
              </p>
            )}
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        {phase === "confirm" && (
          <>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={start} disabled={total === 0}>
              <RefreshCw className="h-4 w-4" /> Start Sending
            </Button>
          </>
        )}
        {phase === "running" && (
          <Button variant="outline" onClick={handleClose}>Stop after this batch</Button>
        )}
        {phase === "done" && (
          <>
            <Button variant="outline" onClick={handleClose}>Close</Button>
            {failed > 0 && (
              <Button onClick={handleResendFailed}><RefreshCw className="h-4 w-4" /> Resend Failed ({failed})</Button>
            )}
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
