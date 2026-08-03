"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Eye, EyeOff, Users, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Cluster { id: number; name: string; location: string }

export default function StaffRegister() {
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", clusterId: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/clusters")
      .then((r) => r.json())
      .then((d) => setClusters(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (!form.clusterId) { setError("Please select a cluster"); setLoading(false); return; }
      const res = await fetch("/api/auth/staff-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
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
                <Label>Select Your Cluster</Label>
                <Select value={form.clusterId || ""} onChange={(e) => setForm({ ...form, clusterId: Number(e.target.value) })} required className="h-10">
                  <option value="">Select a cluster...</option>
                  {clusters.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="Min 6 characters" className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
