"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, User, Filter, CalendarDays, Bell, RefreshCw } from "lucide-react";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";

export default function AdminAllocations() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [allocating, setAllocating] = useState<number | null>(null);
  const [phase2Busy, setPhase2Busy] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/applications").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
    ])
      .then(([a, c]) => {
        setApps(Array.isArray(a) ? a : []);
        setClusters(c);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAllocate(applicationId: number, clusterId: number) {
    setAllocating(applicationId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, clusterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Allocation failed");
      setApps((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, allocatedCluster: clusterId, allocatedName: clusters.find((c) => c.id === clusterId)?.name, status: "allocated" }
            : a
        )
      );
      setMessage({ type: "success", text: `Allocated to ${clusters.find((c) => c.id === clusterId)?.name}` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setAllocating(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handleAutoAllocate() {
    setAllocating(-1);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/allocate", { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const [aRes, cRes] = await Promise.all([
        fetch("/api/admin/applications"),
        fetch("/api/clusters"),
      ]);
      setApps(await aRes.json());
      setClusters(await cRes.json());
      setMessage({ type: "success", text: `Auto-allocation complete! ${data.allocated} students allocated.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setAllocating(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handlePhase2() {
    setPhase2Busy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/phase2", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setPhase2Busy(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function handleReminder() {
    setReminderBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reminder", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setReminderBusy(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  const departments = [...new Set(apps.map((a) => a.student?.department).filter(Boolean))].sort();
  const pagination = usePagination(apps, 25);
  const pageApps = pagination.pageItems;
  const filtered = apps.filter((a) => {
    if (filter === "pending" && a.status !== "pending") return false;
    if (filter === "allocated" && a.status !== "allocated") return false;
    if (filter === "reapplying" && a.status !== "reapplying") return false;
    if (deptFilter && a.student?.department !== deptFilter) return false;
    return true;
  });

  // clusters eligible for a student's department (has slots > 0 for that dept)
  function eligibleFor(dept: string) {
    return clusters.filter((c) => c.allowedDepartments?.some((ad: any) => ad.department?.abbreviation === dept && ad.slots > 0));
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Allocations</h2>
            <p className="text-sm text-slate-500">{apps.filter((a) => a.status === "pending").length} pending</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 lg:flex-wrap lg:overflow-visible">
            <Button variant="outline" className="shrink-0" onClick={() => router.push("/admin/reapplications")}>
              <RefreshCw className="h-4 w-4" />
              Re-applications ({apps.filter((a) => a.status === "reapplying").length})
            </Button>
            <Button onClick={handleAutoAllocate} disabled={allocating === -1} variant="accent" className="shrink-0">
              <Zap className="h-4 w-4" />
              {allocating === -1 ? "Allocating..." : "Auto-Allocate All"}
            </Button>
            <Button onClick={handlePhase2} disabled={phase2Busy} variant="outline" className="shrink-0">
              <CalendarDays className="h-4 w-4" />
              {phase2Busy ? "Preparing..." : "Phase 2 Allocation"}
            </Button>
            <Button onClick={handleReminder} disabled={reminderBusy} variant="outline" className="shrink-0">
              <Bell className="h-4 w-4" />
              {reminderBusy ? "Sending..." : "Send Shift Reminder"}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {["all", "pending", "allocated", "reapplying"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Depts</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </div>

        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Dept</TableHead>
                  <TableHead>Preferences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-slate-400">No applications found</TableCell></TableRow>
                ) : pageApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white">{app.student?.fullName}</p>
                          <p className="text-xs text-slate-400">{app.student?.studentId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{app.student?.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p><span className="text-amber-600 font-semibold">1:</span> {app.pref1Name}</p>
                        <p className="text-slate-400">2: {app.pref2Name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.status === "reapplying" ? (
                        <Badge variant={app.pendingRequest?.type === "transfer" ? "secondary" : "warning"}>
                          {app.pendingRequest?.type === "transfer" ? "Transfer Request" : "Re-application"}
                        </Badge>
                      ) : app.status === "allocated" ? (
                        <Badge variant="success">{app.allocatedName || "Allocated"}</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={app.allocatedCluster || ""}
                        onChange={(e) => handleAllocate(app.id, Number(e.target.value))}
                        disabled={allocating === app.id || app.status === "reapplying"}
                        className="w-52 text-xs h-8"
                      >
                        <option value="">
                          {app.status === "allocated" ? "Reallocate to..." : "Allocate to..."}
                        </option>
                        {eligibleFor(app.student?.department).map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name.slice(0, 30)}</option>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile allocation cards (below lg) */}
        <div className="space-y-3 lg:hidden pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-slate-400">No applications found</CardContent></Card>
          ) : pageApps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{app.student?.fullName}</p>
                      <p className="text-xs text-slate-400">{app.student?.studentId} · {app.student?.department}</p>
                    </div>
                  </div>
                  {app.status === "reapplying" ? (
                    <Badge variant={app.pendingRequest?.type === "transfer" ? "secondary" : "warning"} className="shrink-0">
                      {app.pendingRequest?.type === "transfer" ? "Transfer" : "Re-app"}
                    </Badge>
                  ) : app.status === "allocated" ? (
                    <Badge variant="success" className="shrink-0">Allocated</Badge>
                  ) : (
                    <Badge variant="warning" className="shrink-0">Pending</Badge>
                  )}
                </div>
                <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                  <p><span className="text-amber-600 font-semibold">Pref 1:</span> {app.pref1Name}</p>
                  <p className="text-slate-500">Pref 2: {app.pref2Name}</p>
                  {app.allocatedName && <p className="text-emerald-600">Allocated: {app.allocatedName}</p>}
                </div>
                <div className="mt-3">
                  <Select
                    value={app.allocatedCluster || ""}
                    onChange={(e) => handleAllocate(app.id, Number(e.target.value))}
                    disabled={allocating === app.id || app.status === "reapplying"}
                    className="w-full text-sm h-11"
                  >
                    <option value="">
                      {app.status === "allocated" ? "Reallocate to..." : "Allocate to..."}
                    </option>
                    {eligibleFor(app.student?.department).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name.slice(0, 40)}</option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Pagination
          total={filtered.length}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.changePageSize}
        />
      </div>
    </AppLayout>
  );
}
