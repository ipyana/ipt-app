"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import { MapPin, Users, Check, AlertTriangle, ArrowRight, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";

interface ClusterDepartment { department: { id: number; name: string; abbreviation: string }; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  allowedDepartments: ClusterDepartment[];
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
  const [fullCluster, setFullCluster] = useState<Cluster | null>(null);

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
    c.allowedDepartments?.some((cd) => cd.slots > 0 && cd.department.abbreviation === user?.department)
  );

  function getProgramSlot(cluster: Cluster) {
    return cluster.allowedDepartments?.find((cd) => cd.department.abbreviation === user?.department) || null;
  }

  function isFull(cluster: Cluster): boolean {
    const cp = getProgramSlot(cluster);
    if (!cp) return true;
    return cp.slots > 0 && cp.enrolled >= cp.slots;
  }

  const selectedIds = [pref1, pref2].filter(Boolean);

  function getAvailableFor() {
    return eligibleClusters;
  }

  // A cluster already chosen for the other preference (Phase 1/2) must not be
  // selectable twice — show it greyed out with a "Chosen as …" badge.
  function isChosenOther(c: Cluster): boolean {
    const otherPref = step === 1 ? pref2 : pref1;
    return otherPref > 0 && otherPref === c.id;
  }

  function currentPref() {
    if (step === 1) return { val: pref1, set: setPref1, label: "First Preference" };
    return { val: pref2, set: setPref2, label: "Second Preference" };
  }

  function selectAndAdvance(clusterId: number) {
    const cluster = clusters.find((c) => c.id === clusterId);
    if (cluster && isFull(cluster)) {
      setFullCluster(cluster);
      return;
    }
    if (cluster && isChosenOther(cluster)) {
      setError(step === 1 ? "This cluster is already selected as your 2nd choice. Pick a different one." : "This cluster is already selected as your 1st choice. Pick a different one.");
      return;
    }
    const { set } = currentPref();
    set(clusterId);
    if (step < 2) setTimeout(() => setStep(step + 1), 200);
  }

  function goToStep(s: number) {
    if (s < step || (s === step + 1 && currentPref().val)) setStep(s);
  }

  async function handleSubmit() {
    if (!pref1 || !pref2) { setError("Select both preferences before submitting."); return; }
    if (pref1 === pref2) { setError("Preferences must be 2 distinct clusters."); return; }
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {getAvailableFor().map((cluster) => {
                const cp = getProgramSlot(cluster)!;
                const selected = val === cluster.id;
                const full = isFull(cluster);
                const chosenOther = isChosenOther(cluster);
                return (
                  <button key={cluster.id} onClick={() => selectAndAdvance(cluster.id)} disabled={chosenOther}
                    className={`text-left rounded-lg border-2 p-4 transition-all duration-200 ${
                      chosenOther ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900"
                      : selected ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 ring-1 ring-primary-500"
                      : full ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-900/10 opacity-80"
                      : "border-slate-200 bg-white hover:border-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-700"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{cluster.name}</h4>
                      {selected && <Badge variant="default" className="shrink-0 text-[10px] px-1.5"><Check className="h-3 w-3" /></Badge>}
                      {chosenOther && <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">{step === 1 ? "Chosen as 2nd" : "Chosen as 1st"}</Badge>}
                      {full && !selected && !chosenOther && <Badge variant="danger" className="shrink-0 text-[10px] px-1.5">FULL</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{cluster.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                      <MapPin className="h-3 w-3" /><span className="truncate">{cluster.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${full ? "text-red-600" : "text-primary-600"}`}>{cp.enrolled}/{cp.slots}</span>
                      <span className={full ? "text-red-500 font-semibold" : "text-slate-400"}>{full ? "NO VACANT" : "Available"}</span>
                    </div>
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

      <Dialog open={!!fullCluster} onClose={() => setFullCluster(null)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Cluster is Full</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>{fullCluster?.name}</strong> is currently <strong>full</strong> for your program.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Please choose another available cluster from the list, or check back later. Your second preference is reserved for the next phase.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-3 mt-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Available clusters:</p>
            <div className="flex flex-wrap gap-1.5">
              {eligibleClusters.filter((c) => !isFull(c)).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setFullCluster(null); selectAndAdvance(c.id); }}
                  className="rounded-full border border-border bg-panel px-3 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFullCluster(null)}>Close</Button>
        </DialogFooter>
      </Dialog>
    </AppLayout>
  );
}
