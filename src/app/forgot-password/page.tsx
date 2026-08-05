"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Mail, ArrowRight, MailCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccess(data.message || "Password reset link sent to your email");
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
          {success ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                  <MailCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white text-center">Check your inbox</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                We sent a password reset link to <strong>{email}</strong>. Use the link in the email to reset your password. The link expires in 24 hours.
              </p>
              <Button variant="outline" className="w-full h-10 mt-6" onClick={() => router.push("/")}>
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white text-center">Forgot Password</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">Enter your email and we'll send you a reset link</p>

              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="h-10 pl-9" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-10">
                  {loading ? "Sending..." : "Send Reset Link"} <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-4">
                Remembered?{" "}
                <button onClick={() => router.push("/")} className="font-medium text-primary-600">Back to Sign In</button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
