"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MapPin, Calendar, BookOpen, GraduationCap, ArrowRightLeft } from "lucide-react";

export default function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferCluster, setTransferCluster] = useState(0);
  const [transferReason, setTransferReason] = useState("");
  const [transferMsg, setTransferMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [transferSaving, setTransferSaving] = useState(false);

  useEffect(() => {
    fetch("/api/staff/students")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout role="staff">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800 mb-8" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout role="staff">
        <div className="max-w-xl mx-auto text-center py-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Data</h2>
          <p className="text-sm text-slate-500 mt-2">You are not assigned to any cluster.</p>
        </div>
      </AppLayout>
    );
  }

  const { staff, cluster, phase1Students, phase2Students } = data;

  async function handleTransferSubmit() {
    setTransferMsg(null);
    if (!transferCluster) { setTransferMsg({ type: "error", text: "Select a cluster" }); return; }
    if (transferReason.length < 10) { setTransferMsg({ type: "error", text: "Provide a reason (min 10 characters)" }); return; }
    setTransferSaving(true);
    try {
      const res = await fetch("/api/staff/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toClusterId: transferCluster, reason: transferReason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setTransferMsg({ type: "success", text: "Transfer request submitted for coordinator approval." });
      setTransferReason("");
      setTransferCluster(0);
    } catch (e: any) { setTransferMsg({ type: "error", text: e.message }); }
    finally { setTransferSaving(false); }
  }

  return (
    <AppLayout role="staff">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {staff?.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Staff Dashboard</p>
        </div>

        <div className="flex items-center justify-between">
          {transferMsg && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              transferMsg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>{transferMsg.text}</div>
          )}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" /> Request Cluster Transfer
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                  <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Your Cluster</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{cluster?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{cluster?.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Students</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {(phase1Students?.length || 0) + (phase2Students?.length || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-600" />
              <CardTitle className="text-base">Phase 1 Students</CardTitle>
              <Badge>{phase1Students?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(phase1Students || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-slate-400 py-8">No students allocated</TableCell>
                  </TableRow>
                ) : (phase1Students || []).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{s.student?.fullName}</p>
                      <p className="text-xs text-slate-400">{s.student?.studentId}</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{s.student?.program}</TableCell>
                    <TableCell><Badge variant="secondary">{s.student?.department}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Phase 2 Students</CardTitle>
              <Badge variant="secondary">{phase2Students?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(phase2Students || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-slate-400 py-8">No students allocated</TableCell>
                  </TableRow>
                ) : (phase2Students || []).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{s.student?.fullName}</p>
                      <p className="text-xs text-slate-400">{s.student?.studentId}</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{s.student?.program}</TableCell>
                    <TableCell><Badge variant="secondary">{s.student?.department}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
              <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
            </div>
            <DialogTitle>Request Cluster Transfer</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Current cluster: <strong>{cluster?.name}</strong>. Select a new cluster and provide a reason. Your request will be reviewed by the coordinator.</p>
            <div className="space-y-1">
              <Label>New Cluster</Label>
              <Select value={transferCluster || ""} onChange={(e) => setTransferCluster(Number(e.target.value))}>
                <option value="">Select cluster...</option>
                <option value="1">Computer Maintenance and Peripherals</option>
                <option value="2">Internet of Things (IoT) &amp; Edge AI</option>
                <option value="3">Computer Networking and Fiber Optics</option>
                <option value="4">Electronics Prototyping and Automation</option>
                <option value="5">Software Development</option>
                <option value="6">Cyber Security</option>
                <option value="7">Multimedia and Marketing</option>
                <option value="8">Artificial Intelligence and Signal Processing</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Why do you want to change clusters?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px] dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button onClick={handleTransferSubmit} disabled={transferSaving}>{transferSaving ? "Submitting..." : "Submit Request"}</Button>
        </DialogFooter>
      </Dialog>
    </AppLayout>
  );
}
