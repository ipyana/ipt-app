"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", clusterId: 0 });
  const [clusters, setClusters] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [existsOpen, setExistsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/clusters")
      .then((r) => r.json())
      .then((data) => setClusters(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.department) { setError("Please select your department"); return; }
    if (!form.clusterId) { setError("Please select your cluster"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          clusterId: form.clusterId,
        }),
      });
      const data = await res.json();
      if (data?.code === "USER_EXISTS" || res.status === 409) {
        setExistsOpen(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(data.message || "Registration submitted. Check your email to activate your account.");
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
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">Register as a cluster facilitator. Set your password via the email link, then wait for approval.</p>

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
                <Label>Your Cluster</Label>
                <Select value={form.clusterId || ""} onChange={(e) => setForm({ ...form, clusterId: Number(e.target.value) })} required className="h-10">
                  <option value="">Select your cluster...</option>
                  {clusters.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </Select>
              </div>
              <p className="text-xs text-slate-400">After submission, you will receive an email with a link to set your password. Your account will be activated once an administrator approves your registration.</p>
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

      <Dialog open={existsOpen} onClose={() => setExistsOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>User Already Exists</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">Contact your facilitator or Admin, or reset password.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExistsOpen(false)}>Close</Button>
          <Button onClick={() => { setExistsOpen(false); router.push("/forgot-password"); }}>Reset Password</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
