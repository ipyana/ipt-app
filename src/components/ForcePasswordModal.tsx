"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ForcePasswordModalProps {
  open: boolean;
  displayName?: string;
  onChanged: () => void;
}

const PASSWORD_RULES = {
  min: 8,
  hasUpper: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

export function ForcePasswordModal({ open, displayName, onChanged }: ForcePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  function validate(): string | null {
    if (newPassword.length < PASSWORD_RULES.min) return `Password must be at least ${PASSWORD_RULES.min} characters`;
    if (!PASSWORD_RULES.hasUpper.test(newPassword)) return "Password must include at least one capital letter";
    if (!PASSWORD_RULES.hasNumber.test(newPassword)) return "Password must include at least one number";
    if (!PASSWORD_RULES.hasSpecial.test(newPassword)) return "Password must include at least one special character";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) { setError(v); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setNewPassword("");
      setConfirmPassword("");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-xl"
      >
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <KeyRound className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white text-center">Set a New Password</h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">
          You must set a new password before continuing{displayName ? `, ${displayName}` : ""}.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                placeholder="Min 8 chars, 1 cap, 1 number, 1 special" className="h-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              placeholder="Re-enter new password" className="h-10" />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-10">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
