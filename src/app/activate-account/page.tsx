"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Eye, EyeOff, KeyRound, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Activation failed");
      setSuccess(data.message || "Account activated!");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/must_Logo.png" alt="MUST Logo" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white text-center">Activate Your Account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">Set a strong password to activate your admin account</p>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Min 8 chars, 1 cap, 1 number, 1 special" className="h-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} placeholder="Re-enter password" className="h-10" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? "Activating..." : "Activate Account"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function ActivateAccount() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>}>
      <ActivateForm />
    </Suspense>
  );
}
