"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  count: number;
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function BulkDeleteDialog({ open, count, label, onClose, onConfirm }: BulkDeleteDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>Delete {label}</DialogTitle>
        </div>
      </DialogHeader>
      <DialogBody>
        <p className="text-sm text-slate-500">
          Are you sure you want to delete <strong>{count}</strong> {label.toLowerCase()}{count !== 1 ? "s" : ""}? This action cannot be undone.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
          {busy ? "Deleting..." : "Delete"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
