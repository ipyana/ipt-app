"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Send,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";

interface WeekEntry {
  weekNumber: number;
  startDate: string;
  endDate: string;
  reportUrl: string | null;
  originalName: string | null;
  submittedAt: string | null;
  submitted: boolean;
}

interface PhaseReports {
  phaseNumber: number;
  clusterId: number;
  startDate: string;
  endDate: string;
  weeks: WeekEntry[];
  submittedCount: number;
  totalWeeks: number;
}

interface ReportData {
  weeksPerPhase: number;
  phases: PhaseReports[];
  totalSubmitted: number;
  totalWeeks: number;
}

export default function StudentReport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [application, setApplication] = useState<any>(null);
  const [clusters, setClusters] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // weekly report state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [openPhases, setOpenPhases] = useState<Record<number, boolean>>({ 1: true, 2: false });

  useEffect(() => {
    Promise.all([
      fetch("/api/clusters").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ])
      .then(([c, a]) => {
        const map: Record<number, string> = {};
        (Array.isArray(c) ? c : []).forEach((cl: any) => (map[cl.id] = cl.name));
        setClusters(map);
        if (a && a.id) setApplication(a);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!application || application.status !== "allocated") return;
    fetch("/api/applications/weekly")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.phases)) setReportData(d);
      })
      .catch(() => {});
  }, [application]);

  function openFilePicker(phase: number, week: number) {
    setSelectedPhase(phase);
    setSelectedWeek(week);
    setFile(null);
    setMessage(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleSubmit() {
    if (!file || !selectedWeek) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("report", file);
      formData.append("phaseNumber", String(selectedPhase));
      formData.append("weekNumber", String(selectedWeek));
      const res = await fetch("/api/applications/weekly", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage({ type: "success", text: `Week ${selectedWeek} (Phase ${selectedPhase}) report submitted successfully!` });
      setFile(null);
      setSelectedWeek(null);
      const refresh = await fetch("/api/applications/weekly");
      const refreshed = await refresh.json();
      if (Array.isArray(refreshed.phases)) setReportData(refreshed);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  }

  function handlePreview(week: WeekEntry) {
    setPreviewUrl(week.reportUrl);
    setPreviewName(week.originalName);
    setPreviewOpen(true);
  }

  if (loading) {
    return (
      <AppLayout role="student">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!application) {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Application Found</h2>
          <p className="text-sm text-slate-500 mt-2">Submit your application first.</p>
        </div>
      </AppLayout>
    );
  }

  if (application.status !== "allocated") {
    return (
      <AppLayout role="student">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Not Yet Allocated</h2>
          <p className="text-sm text-slate-500 mt-2">
            Report upload will be available after you receive your cluster allocation.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/student/status")}>
            Check Status
          </Button>
        </div>
      </AppLayout>
    );
  }

  const allocatedName = clusters[application.allocatedCluster] || "Unknown Cluster";
  const totalWeeks = reportData?.totalWeeks || 0;
  const totalSubmitted = reportData?.totalSubmitted || 0;

  return (
    <AppLayout role="student">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Weekly Reports
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Submit your weekly IPT reports for <strong>{allocatedName}</strong>
          </p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-lg border p-4 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* Progress summary */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Overall Progress</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalSubmitted} / {totalWeeks || 0}
              </p>
              <p className="text-xs text-slate-400">weekly reports submitted</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {totalWeeks ? Math.round((totalSubmitted / totalWeeks) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Week grid — thumb-first collapsible phases */}
        {(reportData?.phases || []).map((phase) => {
          const open = openPhases[phase.phaseNumber] ?? phase.phaseNumber === 1;
          return (
            <Card key={phase.phaseNumber}>
              <button
                type="button"
                onClick={() => setOpenPhases((p) => ({ ...p, [phase.phaseNumber]: !open }))}
                className="w-full text-left"
                aria-expanded={open}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="h-4 w-4 text-primary-600 shrink-0" />
                      <CardTitle className="text-base">Phase {phase.phaseNumber}</CardTitle>
                      <Badge variant={phase.submittedCount === phase.totalWeeks ? "success" : "warning"} className="shrink-0">
                        {phase.submittedCount}/{phase.totalWeeks}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
                    />
                  </div>
                  <CardDescription>
                    {new Date(phase.startDate).toLocaleDateString("en-TZ")} – {new Date(phase.endDate).toLocaleDateString("en-TZ")}
                  </CardDescription>
                </CardHeader>
              </button>
              {open && (
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {phase.weeks.map((week) => {
                      const isSelected = selectedWeek === week.weekNumber && selectedPhase === phase.phaseNumber;
                      return (
                        <div
                          key={week.weekNumber}
                          className={`rounded-lg border p-4 transition-colors ${
                            week.submitted
                              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900 dark:text-white">Week {week.weekNumber}</p>
                            {week.submitted ? (
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(week.startDate).toLocaleDateString("en-TZ")} – {new Date(week.endDate).toLocaleDateString("en-TZ")}
                          </p>

                          {week.submitted ? (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="truncate">{week.originalName || "Report uploaded"}</span>
                              </div>
                              <Button size="sm" variant="outline" className="w-full h-10" onClick={() => handlePreview(week)}>
                                <Eye className="h-4 w-4" /> View Report
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={isSelected ? "primary" : "outline"}
                              className="w-full mt-3 h-10"
                              onClick={() => openFilePicker(phase.phaseNumber, week.weekNumber)}
                            >
                              <Upload className="h-4 w-4" /> Upload Report
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preview & Submit dialog */}
        <AnimatePresence>
          {file && selectedWeek && (
            <Dialog open={!!file} onClose={() => setFile(null)}>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <DialogTitle>Preview & Submit — Week {selectedWeek} (Phase {selectedPhase})</DialogTitle>
                </div>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                    <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <p className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Once you submit this report, it cannot be withdrawn or changed. Review your file carefully before submitting.
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Please verify the file is the correct report for Week {selectedWeek}. After submission, it is final.
                  </p>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </Dialog>
          )}
        </AnimatePresence>

        {/* View submitted report dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <DialogTitle>Submitted Report</DialogTitle>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" /> {previewName || "Report"}
                </span>
                <Badge variant="success">Submitted</Badge>
              </div>
              {previewUrl && (
                <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-primary-600 hover:underline">
                    <Eye className="h-8 w-8" />
                    <span className="text-sm">Open / Download Report</span>
                  </a>
                </div>
              )}
              <p className="text-xs text-slate-400">
                This report has been submitted and is final. No withdrawal is allowed.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            {previewUrl && (
              <Button asChild>
                <a href={previewUrl} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> Open Report</a>
              </Button>
            )}
          </DialogFooter>
        </Dialog>
      </div>
    </AppLayout>
  );
}
