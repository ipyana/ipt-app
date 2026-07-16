"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import { MapPin, Users, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClusterProgram { program: { id: number; name: string }; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  allowedPrograms: ClusterProgram[];
  staff: { name: string; email: string }[];
}

export default function StudentApply() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [pref1, setPref1] = useState<number>(0);
  const [pref2, setPref2] = useState<number>(0);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ])
      .then(([u, c, a]) => {
        setUser(u);
        setClusters(Array.isArray(c) ? c : []);
        if (a && a.id) { setExistingApp(a); setPref1(a.clusterPref1); setPref2(a.clusterPref2); }
      })
      .finally(() => setLoading(false));
  }, []);

  const eligibleClusters = clusters.filter((c) =>
    c.allowedPrograms?.some((cp) => cp.slots > 0 && cp.program.name === user?.program)
  );

  function getProgramSlot(cluster: Cluster) {
    return cluster.allowedPrograms?.find((cp) => cp.program.name === user?.program) || null;
  }

  const selectedIds = [pref1, pref2].filter(Boolean);

  function getAvailableFor(current: number) {
    return eligibleClusters.filter((c) => !selectedIds.includes(c.id) || c.id === current);
  }

  function currentPref() {
    if (step === 1) return { val: pref1, set: setPref1, label: "First Preference" };
    return { val: pref2, set: setPref2, label: "Second Preference" };
  }

  function selectAndAdvance(clusterId: number) {
    const { set } = currentPref();
    set(clusterId);
    if (step < 2) setTimeout(() => setStep(step + 1), 200);
  }

  function goToStep(s: number) {
    if (s < step || (s === step + 1 && currentPref().val)) setStep(s);
  }

  async function handleSubmit() {
    if (!pref1 || !pref2) { setError("Select both preferences before submitting."); return; }
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: existingApp ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pref1, pref2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(existingApp ? "Preferences updated!" : "Application submitted!");
      setExistingApp(data);
      setTimeout(() => router.push("/student/dashboard"), 1500);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <AppLayout role="student"><div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div></AppLayout>;

  if (existingApp && existingApp.status !== "pending") {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="flex justify-center mb-6"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20"><AlertTriangle className="h-10 w-10 text-amber-600" /></div></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Locked</h2>
          <p className="text-sm text-slate-500 mt-2">Your application has been <strong>{existingApp.status}</strong>.</p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/student/status")}>View Status</Button>
        </div>
      </AppLayout>
    );
  }

  if (eligibleClusters.length === 0) {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="flex justify-center mb-6"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800"><AlertTriangle className="h-10 w-10 text-slate-400" /></div></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Clusters Available</h2>
          <p className="text-sm text-slate-500 mt-2">No clusters have been allocated for <strong>{user?.program}</strong> yet. Please contact your department.</p>
        </div>
      </AppLayout>
    );
  }

  const { val } = currentPref();
  const preferences = [
    { label: "1st Choice", value: pref1 },
    { label: "2nd Choice", value: pref2 },
  ];

  return (
    <AppLayout role="student">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{existingApp ? "Update Preferences" : "Select Your Clusters"}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Program: <Badge variant="default">{user?.program}</Badge> · {eligibleClusters.length} clusters available
          </p>
        </div>

        <Steps steps={[{ label: "1st Choice", description: "Most preferred" }, { label: "2nd Choice", description: "Second option" }]} current={step - 1} className="mb-8" />

        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
        {success && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"><Check className="h-4 w-4 shrink-0" />{success}</div>}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{currentPref().label}</h3>
              <p className="text-sm text-slate-400">Select one cluster</p>
            </div>
            <div className="space-y-3">
              {getAvailableFor(val).map((cluster) => {
                const cp = getProgramSlot(cluster)!;
                return (
                  <button key={cluster.id} onClick={() => selectAndAdvance(cluster.id)}
                    className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                      val === cluster.id ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-sm ring-1 ring-primary-500"
                      : "border-slate-200 bg-white hover:border-primary-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-700"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{cluster.name}</h4>
                          {val === cluster.id && <Badge variant="default" className="shrink-0"><Check className="h-3 w-3 mr-0.5" /> Selected</Badge>}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{cluster.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cluster.location}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cluster.staff.map((s) => s.name.split(" ").pop()).join(", ")}</span>
                          <span className="font-medium text-primary-600">{cp.enrolled}/{cp.slots} slots for {user?.program}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600">
                          {val === cluster.id ? <Check className="h-4 w-4 text-primary-600" /> : <span className="text-sm text-slate-400">{step}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3"><Progress value={cp.enrolled} max={cp.slots} size="sm" variant={cp.enrolled / cp.slots > 0.9 ? "danger" : cp.enrolled / cp.slots > 0.7 ? "warning" : "primary"} /></div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={() => step > 1 && goToStep(step - 1)} disabled={step === 1}>Back</Button>
          <div className="flex items-center gap-3">
            {preferences.map((p, i) => (
              <button key={i} onClick={() => goToStep(i + 1)} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${step === i + 1 ? "text-primary-600" : p.value ? "text-slate-500 hover:text-slate-700" : "text-slate-300"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${p.value ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                  {p.value ? <Check className="h-3 w-3" /> : i + 1}
                </span>
              </button>
            ))}
          </div>
          {step < 2 ? (
            <Button onClick={() => val && setStep(step + 1)} disabled={!val}>Next <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !pref2}>{submitting ? "Submitting..." : existingApp ? "Update" : "Submit"}</Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
