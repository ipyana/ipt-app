"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

export default function SuperAdminWaitlist() {
  const [waitlisted, setWaitlisted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/super-admin/waitlist");
    const data = await res.json();
    setWaitlisted(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approveApp(applicationId: number) {
    setProcessing(applicationId);
    try {
      const res = await fetch("/api/super-admin/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      if (res.ok) load();
    } finally {
      setProcessing(null);
    }
  }

  async function rejectApp(applicationId: number) {
    setProcessing(applicationId);
    try {
      const res = await fetch("/api/super-admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      if (res.ok) load();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Waitlist Management</h2>
          <p className="text-sm text-slate-500 mt-1">{waitlisted.length} students waiting for allocation</p>
        </div>

        {waitlisted.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Waitlisted Students</h3>
              <p className="text-sm text-slate-500 mt-2">All students have been allocated.</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>1st Preference</TableHead>
                    <TableHead>2nd Preference</TableHead>
                    <TableHead>Waitlisted Since</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlisted.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{w.student?.fullName}</p>
                        <p className="text-xs text-slate-400">{w.student?.studentId}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{w.student?.program}</TableCell>
                      <TableCell><Badge>{w.pref1Name || "—"}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{w.pref2Name || "—"}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {w.waitlistedAt ? new Date(w.waitlistedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveApp(w.id)} disabled={processing === w.id}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectApp(w.id)} disabled={processing === w.id}>
                            <XCircle className="h-3 w-3 mr-1" /> Skip
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
