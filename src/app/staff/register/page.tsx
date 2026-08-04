"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const DEPARTMENTS = [
  { name: "Computer Science and Engineering", abbreviation: "CSE" },
  { name: "Electronics and Telecommunication Engineering", abbreviation: "ETE" },
  { name: "Informatics", abbreviation: "IF" },
  { name: "Information Science and Technology", abbreviation: "IST" },
  { name: "Technical Education", abbreviation: "TED" },
];

export default function StaffRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", department: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.department) { setError("Please select your department"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          department: form.department,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(data.message || "Registration submitted for approval");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/must_Logo.png" alt="MUST Logo" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white text-center">Facilitator Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">Register as a cluster facilitator. Your account will be activated after approval.</p>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-700">{success}</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-10" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+255..." className="h-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Your Department</Label>
                <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required className="h-10">
                  <option value="">Select your department...</option>
                  {DEPARTMENTS.map((d) => (<option key={d.abbreviation} value={d.abbreviation}>{d.name} ({d.abbreviation})</option>))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="Min 8 chars, 1 cap, 1 number, 1 special" className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Re-Enter Password</Label>
                <Input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required minLength={8} placeholder="Re-enter your password" className="h-10" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-10">
                {loading ? "Submitting..." : "Submit for Approval"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-4">
            Already registered?{" "}
            <button onClick={() => router.push("/")} className="font-medium text-primary-600">Sign In</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
