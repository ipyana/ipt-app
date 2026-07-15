"use client";

import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Upload } from "lucide-react";

const CSV_COLUMNS = [
  "Student ID", "Full Name", "Department", "Program", "Email",
  "Preference 1", "Preference 2", "Preference 3",
  "Status", "Allocated Cluster", "Submission Date",
];

export default function AdminExport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [importResult, setImportResult] = useState<any>(null);

  async function handleExportApps() {
    setAppLoading(true);
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ipt-applications-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("Applications CSV exported!");
    } catch (e: any) { setMessage(e.message); }
    finally { setAppLoading(false); setTimeout(() => setMessage(""), 3000); }
  }

  async function handleDownloadTemplate() {
    try {
      const res = await fetch("/api/admin/export/template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "ipt-data-template.csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }

  async function handleImport(file: File) {
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await res.json();
      setImportResult(data);
    } catch (e: any) { setImportResult({ error: e.message }); }
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Export & Import</h2>
          <p className="text-sm text-slate-500 mt-1">Download reports and manage data in bulk</p>
        </div>

        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">{message}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer" onClick={handleExportApps}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20"><FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Applications CSV</h3>
                  <p className="text-xs text-slate-500 mt-1">All student applications and allocations</p>
                  <Button size="sm" className="mt-3" disabled={appLoading}><Download className="h-3 w-3" />{appLoading ? "Exporting..." : "Download"}</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer" onClick={handleDownloadTemplate}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20"><Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Data Template</h3>
                  <p className="text-xs text-slate-500 mt-1">Download CSV to fill in departments, programs, clusters, and slots</p>
                  <Button size="sm" variant="outline" className="mt-3"><Download className="h-3 w-3" />Download Template</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Bulk Import Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileRef} type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} className="hidden" />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Choose CSV File
            </Button>
            {importResult && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <p className="text-sm font-medium">{importResult.error || importResult.message}</p>
                {importResult.summary && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(importResult.summary).map(([k, v]) => (
                      <div key={k} className="flex justify-between rounded bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5">
                        <span className="text-slate-500 capitalize">{k}</span>
                        <span className="font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {importResult.errors?.length > 0 && (
                  <div className="text-xs text-red-600">
                    <p className="font-medium">Errors:</p>
                    {importResult.errors.map((e: string, i: number) => (<p key={i}>· {e}</p>))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Application CSV Columns</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CSV_COLUMNS.map((col) => (<div key={col} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400">{col}</div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
