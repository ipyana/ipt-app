"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, AlertTriangle, Clock, MapPin, Users, CheckCircle, ArrowLeftRight,
} from "lucide-react";

interface ClusterDepartment { department: { id: number; name: string; abbreviation: string }; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  allowedDepartments: ClusterDepartment[];
  staff: { name: string; email: string }[];
}

type TransferMode = "choice" | "swapOne" | "swapBoth" | "done";

export default function StudentTransfer() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clusterMap, setClusterMap] = useState<Record<number, Cluster>>({});

  const [mode, setMode] = useState<TransferMode>("choice");
  const [swapTarget, setSwapTarget] = useState<number>(0); // which cluster to replace (pref1 or pref2)
  const [toClusterId, setToClusterId] = useState(0);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState(1);
  const [pref1, setPref1] = useState(0);
  const [pref2, setPref2] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ]).then(([u, c, a]) => {
      setUser(u);
      const cls = Array.isArray(c) ? c : [];
      setClusters(cls);
      setClusterMap(Object.fromEntries(cls.map((cl: Cluster) => [cl.id, cl])));
      if (a && a.id) setApplication(a);
    }).finally(() => setLoading(false));
  }, []);

  const eligibleClusters = clusters.filter((cl) =>
    cl.allowedDepartments?.some((cd) => cd.slots > 0 && cd.department.abbreviation === user?.department)
  );

  // Exclude the student's current clusters entirely (cannot select same cluster for swap)
  const currentClusters = application ? [application.clusterPref1, application.clusterPref2] : [];

  // For swapOne: clusters that aren't the student's current ones
  const swapEligible = eligibleClusters.filter((c) => !currentClusters.includes(c.id));

  function getAvailableFor(current: number) {
    return eligibleClusters
      .filter((c) => !currentClusters.includes(c.id))
      .filter((c) => ![pref1, pref2].includes(c.id) || c.id === current);
  }

  async function handleSubmit() {
    setError("");

    if (mode === "swapOne") {
      if (!swapTarget || !toClusterId) { setError("Select which cluster to replace and the new cluster"); return; }
      if (!reason || reason.trim().length < 10) { setError("Provide a reason (min 10 characters)"); return; }
    } else {
      if (!pref1 || !pref2 || pref1 === pref2) { setError("Select two distinct clusters"); return; }
      if (!reason || reason.trim().length < 10) { setError("Provide a reason (min 10 characters)"); return; }
    }

    setSubmitting(true);
    try {
      const body: any = {};
      if (mode === "swapOne") {
        body.type = "transfer";
        body.swapTarget = swapTarget;
        body.toClusterId = toClusterId;
        body.reason = reason;
      } else {
        body.type = "transfer";
        body.pref1 = pref1;
        body.pref2 = pref2;
        body.reason = reason;
      }
      const res = await fetch("/api/applications/reapply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMode("done");
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <AppLayout role="student"><div className="flex h-96 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div></AppLayout>;

  if (!application || application.status !== "allocated") {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Active Allocation</h2>
          <p className="text-sm text-slate-500 mt-2">{!application ? "You have no application yet." : "Your application is not currently allocated."}</p>
          <Button className="mt-6" onClick={() => router.push("/student/apply")}>Apply Now</Button>
        </div>
      </AppLayout>
    );
  }

  if (application.status === "reapplying") {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <Clock className="h-10 w-10 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Under Review</h2>
          <p className="text-sm text-slate-500 mt-2">You already have a pending transfer or reapplication request.</p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/student/status")}>View Status</Button>
        </div>
      </AppLayout>
    );
  }

  const c1 = clusterMap[application.clusterPref1];
  const c2 = clusterMap[application.clusterPref2];

  return (
    <AppLayout role="student">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transfer Clusters</h2>
          <p className="text-sm text-slate-500 mt-1">Swap one cluster or change both of your current preferences</p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Current Allocation</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <span className="text-sm text-slate-600">1st Choice</span>
                <Badge>{c1?.name || "Unknown"}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <span className="text-sm text-slate-600">2nd Choice</span>
                <Badge variant="secondary">{c2?.name || "Unknown"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {mode === "choice" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-sm text-slate-500 mb-2">What would you like to do?</p>
            <button onClick={() => setMode("swapOne")}
              className="w-full text-left rounded-lg border-2 border-slate-200 p-4 hover:border-primary-300 transition-all dark:border-slate-700">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Swap one cluster</p>
                  <p className="text-xs text-slate-400 mt-0.5">Replace one of your current clusters with a different one</p>
                </div>
              </div>
            </button>
            <button onClick={() => setMode("swapBoth")}
              className="w-full text-left rounded-lg border-2 border-slate-200 p-4 hover:border-primary-300 transition-all dark:border-slate-700">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Change both clusters</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pick two completely new cluster preferences</p>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {mode === "swapOne" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Which cluster to replace?</label>
              <div className="flex gap-2">
                <button onClick={() => setSwapTarget(application.clusterPref1)}
                  className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-all ${swapTarget === application.clusterPref1 ? "border-primary-500 bg-primary-50" : "border-slate-200"}`}>
                  1st: {c1?.name}
                </button>
                <button onClick={() => setSwapTarget(application.clusterPref2)}
                  className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-all ${swapTarget === application.clusterPref2 ? "border-primary-500 bg-primary-50" : "border-slate-200"}`}>
                  2nd: {c2?.name}
                </button>
              </div>
            </div>

            {swapTarget > 0 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Select replacement cluster</label>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                    {swapEligible.map((c) => (
                      <button key={c.id} onClick={() => setToClusterId(c.id)}
                        className={`text-left rounded-lg border-2 p-3 text-sm transition-all ${toClusterId === c.id ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-primary-200"}`}>
                        <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{c.location}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Reason for transfer</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px] dark:bg-slate-900 dark:border-slate-700"
                    placeholder="Explain why you want to transfer (min 10 characters)" />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setMode("choice"); setError(""); }}>Back</Button>
              <Button onClick={handleSubmit} disabled={submitting || !toClusterId || reason.length < 10}>
                {submitting ? "Submitting..." : "Submit Transfer"}
              </Button>
            </div>
          </motion.div>
        )}

        {mode === "swapBoth" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Steps steps={[{ label: "1st Choice" }, { label: "2nd Choice" }]} current={step - 1} className="mb-2" />

            {step === 1 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Select your new 1st preference</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto">
                  {eligibleClusters.filter((c) => c.id !== pref2).map((c) => (
                    <button key={c.id} onClick={() => { setPref1(c.id); setStep(2); }}
                      className={`text-left rounded-lg border-2 p-3 text-sm transition-all ${pref1 === c.id ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-primary-200"}`}>
                      <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.location}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Select your new 2nd preference</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto">
                  {eligibleClusters.filter((c) => c.id !== pref1).map((c) => (
                    <button key={c.id} onClick={() => setPref2(c.id)}
                      className={`text-left rounded-lg border-2 p-3 text-sm transition-all ${pref2 === c.id ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-primary-200"}`}>
                      <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.location}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Reason for change</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px] dark:bg-slate-900 dark:border-slate-700"
                  placeholder="Explain why you want to change (min 10 characters)" />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => step > 1 ? setStep(1) : () => setMode("choice")}>Back</Button>
              {step === 2 && pref2 > 0 && (
                <Button onClick={handleSubmit} disabled={submitting || reason.length < 10}>
                  {submitting ? "Submitting..." : "Submit Changes"}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {mode === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transfer Submitted!</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Your transfer request has been submitted successfully. An administrator will review it within 72 hours. You will be notified of the outcome.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={() => router.push("/student/dashboard")}>Back to Dashboard</Button>
              <Button onClick={() => router.push("/student/status")}>View Status</Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
