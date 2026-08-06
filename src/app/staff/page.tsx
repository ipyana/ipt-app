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
import { Users, MapPin, Calendar, BookOpen, GraduationCap, ArrowRightLeft, Megaphone, Paperclip } from "lucide-react";

export default function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferCluster, setTransferCluster] = useState(0);
  const [transferReason, setTransferReason] = useState("");
  const [transferMsg, setTransferMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [transferSaving, setTransferSaving] = useState(false);
  const [allClusters, setAllClusters] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/staff/students")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
    fetch("/api/clusters")
      .then((r) => r.json())
      .then((d) => setAllClusters(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/staff/announcements")
      .then((r) => r.json())
      .then((d) => setAnnouncements(Array.isArray(d.announcements) ? d.announcements : []))
      .catch(() => {});
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

  const { staff, cluster, phase1Students, phase2Students, capacity, currentEnrolled, phase1, phase2 } = data;

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
                  <p className="text-xs text-slate-500">Capacity Used</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {capacity ? `${Math.round((currentEnrolled / capacity) * 100)}%` : "—"}
                    <span className="text-sm font-normal text-slate-400"> ({currentEnrolled}/{capacity})</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PhaseStatCard title="Phase 1" phase={phase1} />
          <PhaseStatCard title="Phase 2" phase={phase2} />
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary-600" />
              <CardTitle className="text-base">Announcements</CardTitle>
              <Badge>{announcements.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {announcements.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No announcements yet</p>
            ) : (
              <div className="divide-y divide-border">
                {announcements.map((a) => (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</p>
                      {!a.read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 whitespace-pre-wrap">{a.body}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{a.cluster?.name || (a.audience === "all" ? "All" : "General")}</span>
                      {a.attachmentUrl && (
                        <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary-600 hover:underline">
                          <Paperclip className="h-2.5 w-2.5" /> {a.attachmentName || "File"}
                        </a>
                      )}
                      <span>· {new Date(a.createdAt).toLocaleDateString("en-TZ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {allClusters
                  .filter((c) => c.id !== cluster?.id)
                  .map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
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

function PhaseStatCard({ title, phase }: { title: string; phase: any }) {
  if (!phase) return null;
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <Badge>{phase.enrolled || 0} students</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          {phase.startDate ? new Date(phase.startDate).toLocaleDateString("en-TZ") : "—"}
          {phase.endDate ? ` – ${new Date(phase.endDate).toLocaleDateString("en-TZ")}` : ""}
        </div>
        {phase.groups?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {phase.groups.map((g: any) => (
              <span key={g.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                <MapPin className="h-3 w-3 text-slate-400" />{g.name}
                <span className="text-slate-400">({g.count})</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No groups yet</p>
        )}
      </CardContent>
    </Card>
  );
}
