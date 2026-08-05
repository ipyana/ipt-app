"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Users, KeyRound, RefreshCw } from "lucide-react";

export interface StaffForReview {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  status: string;
  cluster?: { id: number; name: string } | null;
}

interface Props {
  open: boolean;
  staff: StaffForReview | null;
  requirePassword: boolean;
  onClose: () => void;
  onApprove: (id: number, temporaryPassword?: string) => Promise<void>;
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function generatePassword(length = 10): string {
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += CHARS[arr[i] % CHARS.length];
  return out;
}

export function StaffApproveDialog({ open, staff, requirePassword, onClose, onApprove }: Props) {
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTempPassword(requirePassword ? generatePassword() : "");
      setError("");
      setBusy(false);
    }
  }, [open, requirePassword, staff?.id]);

  async function handleApprove() {
    setError("");
    if (requirePassword && tempPassword.length < 6) {
      setError("Temporary password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await onApprove(staff!.id, requirePassword ? tempPassword : tempPassword || undefined);
    } catch (e: any) {
      setError(e.message || "Failed to approve");
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <DialogTitle>Review & Approve</DialogTitle>
            <p className="text-xs text-slate-400">Directly activate this facilitator</p>
          </div>
        </div>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900 dark:text-white">{staff?.name}</span>
              <Badge variant="warning">{staff?.status === "rejected" ? "Rejected" : "Awaiting Activation"}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{staff?.email}</p>
            {staff?.department && <p className="text-xs text-slate-500">Dept: {staff.department}</p>}
            <p className="text-xs text-slate-500 mt-0.5">Cluster: {staff?.cluster?.name || "—"}</p>
          </div>

          {requirePassword ? (
            <div className="space-y-1.5">
              <Label>Set a temporary password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="pl-9 font-mono" placeholder="Temporary password" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setTempPassword(generatePassword())}>
                  <RefreshCw className="h-3.5 w-3.5" /> Generate
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                This facilitator has not set a password yet. They will sign in with this temporary password and be required to change it on first login. The password is emailed to them.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Temporary password (optional)</Label>
              <div className="flex gap-2">
                <Input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="font-mono" placeholder="Leave blank to keep current password" />
                <Button type="button" variant="outline" size="sm" onClick={() => setTempPassword(generatePassword())}>
                  <RefreshCw className="h-3.5 w-3.5" /> Generate
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Leave blank to keep this facilitator's existing password, or set a new temporary password.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleApprove} disabled={busy}>{busy ? "Approving..." : "Approve & Activate"}</Button>
      </DialogFooter>
    </Dialog>
  );
}
