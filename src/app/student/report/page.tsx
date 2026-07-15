"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudentReport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [application, setApplication] = useState<any>(null);
  const [clusters, setClusters] = useState<Record<number, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("report", file);
      const res = await fetch("/api/applications/report", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage({ type: "success", text: "Report uploaded successfully!" });
      setFile(null);
      setApplication((prev: any) => ({ ...prev, reportUrl: data.url }));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
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

  return (
    <AppLayout role="student">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upload Report
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Submit your IPT report for <strong>{allocatedName}</strong>
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

        <Card>
          <CardHeader>
            <CardTitle>Report File</CardTitle>
            <CardDescription>Upload a PDF or Word document (max 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
            >
              <Upload className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {file ? file.name : "Click to select a file"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : "PDF, DOC, or DOCX — up to 10MB"}
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {application.reportUrl && (
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Report Submitted</p>
                  <p className="text-sm text-slate-500">Your report has been received.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
