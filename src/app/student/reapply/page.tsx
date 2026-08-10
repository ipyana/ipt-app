"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, AlertTriangle, Clock, MapPin, Users, CheckCircle,
} from "lucide-react";
import { useWindowStatus } from "@/hooks/useWindowStatus";
import { WindowClosedModal } from "@/components/WindowClosedModal";

interface ClusterDepartment { department: { id: number; name: string; abbreviation: string }; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  allowedDepartments: ClusterDepartment[];
  staff: { name: string; email: string }[];
}

export default function StudentReapply() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<"info" | "select" | "done">("info");
  const [step, setStep] = useState(1);
  const [pref1, setPref1] = useState(0);
  const [pref2, setPref2] = useState(0);
  const [clusterMap, setClusterMap] = useState<Record<number, Cluster>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { status: windowStatus, open: windowOpen } = useWindowStatus("reapplication");
  const [windowModalOpen, setWindowModalOpen] = useState(false);

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

  // Exclude the student's current allocation clusters from reapplication choices
  const currentClusters = application ? [application.clusterPref1, application.clusterPref2] : [];
  const eligibleClusters = clusters.filter((cl) =>
    cl.allowedDepartments?.some((cd) => cd.slots > 0 && cd.department.abbreviation === user?.department)
  ).filter((c) => !currentClusters.includes(c.id));

  function getAvailableFor() {
    return eligibleClusters;
  }

  function isChosenOther(c: Cluster): boolean {
    const otherPref = step === 1 ? pref2 : pref1;
    return otherPref > 0 && otherPref === c.id;
  }

  async function handleSubmit() {
    if (!windowOpen) {
      setWindowModalOpen(true);
      return;
    }
    if (!pref1 || !pref2 || pref1 === pref2) {
      setError("Select two distinct clusters");
      return;
    }
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/applications/reapply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reapplication", pref1, pref2, reason: "Full reapplication" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPhase("done");
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <AppLayout role="student"><div className="flex h-96 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div></AppLayout>;

  if (!application) {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Application Found</h2>
          <p className="text-sm text-slate-500 mt-2">You need to submit an application before reapplying.</p>
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reapplication Under Review</h2>
          <p className="text-sm text-slate-500 mt-2">Your reapplication is currently under review. Please wait for a response.</p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/student/status")}>View Status</Button>
        </div>
      </AppLayout>
    );
  }

  if (application.status !== "allocated") {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <Clock className="h-10 w-10 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Not Ready</h2>
          <p className="text-sm text-slate-500 mt-2">Your application has not been allocated yet. Please wait or contact support.</p>
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Re-apply for Clusters</h2>
          <p className="text-sm text-slate-500 mt-1">Cancel your current allocation and submit a new preference</p>
        </div>

        {phase === "info" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                <Badge variant="success">Allocated</Badge>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10 p-4 text-sm text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> Reapplying will cancel your current allocation. Your request will be reviewed by an administrator within 72 hours.
            </div>

            <Button onClick={() => setPhase("select")} size="lg">
              Cancel & Re-apply <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {phase === "select" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Steps steps={[{ label: "1st Choice" }, { label: "2nd Choice" }]} current={step - 1} className="mb-4" />

            {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {step === 1 ? "Select your new 1st preference" : "Select your new 2nd preference"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {getAvailableFor().map((cluster) => {
                    const isSelected = (step === 1 && pref1 === cluster.id) || (step === 2 && pref2 === cluster.id);
                    const chosenOther = isChosenOther(cluster);
                    return (
                      <button key={cluster.id} disabled={chosenOther} onClick={() => {
                        if (step === 1) { setPref1(cluster.id); setTimeout(() => setStep(2), 200); }
                        else setPref2(cluster.id);
                      }}
                        className={`text-left rounded-lg border-2 p-3 transition-all ${
                          chosenOther ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900"
                          : isSelected ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-slate-200 hover:border-primary-200 dark:border-slate-700"
                        }`}>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{cluster.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cluster.location}</p>
                        {chosenOther ? (
                          <span className="text-[11px] font-medium text-slate-400 mt-1">{step === 1 ? "Chosen as 2nd" : "Chosen as 1st"}</span>
                        ) : isSelected && <Check className="h-4 w-4 text-primary-600 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => step > 1 ? setStep(1) : setPhase("info")} disabled={step === 1 && phase === "select"}>
                Back
              </Button>
              {step === 2 && pref2 > 0 && (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Reapplication"}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reapplication Submitted!</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Your reapplication has been submitted successfully. An administrator will review it within 72 hours. You will be notified of the outcome.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={() => router.push("/student/dashboard")}>Back to Dashboard</Button>
              <Button onClick={() => router.push("/student/status")}>View Status</Button>
            </div>
          </motion.div>
        )}
      </div>

      <WindowClosedModal
        open={windowModalOpen}
        message={windowStatus?.message || "The Reapplication Window is closed. Check with your IPT Coordinator."}
        onClose={() => setWindowModalOpen(false)}
      />
    </AppLayout>
  );
}
