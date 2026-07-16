"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select as UISelect } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, User, Filter } from "lucide-react";

export default function AdminAllocations() {
  const [apps, setApps] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [allocating, setAllocating] = useState<number | null>(null);

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

  const departments = [...new Set(apps.map((a) => a.student?.department).filter(Boolean))].sort();
  const filtered = apps.filter((a) => {
    if (filter === "pending" && a.status !== "pending") return false;
    if (filter === "allocated" && a.status !== "allocated") return false;
    if (deptFilter && a.student?.department !== deptFilter) return false;
    return true;
  });

  return (
    <AppLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Allocations</h2>
            <p className="text-sm text-slate-500">{apps.filter((a) => a.status === "pending").length} pending</p>
          </div>
          <Button onClick={handleAutoAllocate} disabled={allocating === -1} variant="accent">
            <Zap className="h-4 w-4" />
            {allocating === -1 ? "Allocating..." : "Auto-Allocate All"}
          </Button>
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
          {["all", "pending", "allocated"].map((f) => (
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
            <Filter className="h-4 w-4 text-slate-400" />
            <UISelect
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Depts</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </UISelect>
          </div>
        </div>

        <Card>
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
                {filtered.map((app) => (
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
                      {app.status === "allocated" ? (
                        <Badge variant="success">{app.allocatedName || "Allocated"}</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.status !== "allocated" ? (
                        <UISelect
                          value={app.allocatedCluster || ""}
                          onChange={(e) => handleAllocate(app.id, Number(e.target.value))}
                          disabled={allocating === app.id}
                          className="w-40 text-xs h-8"
                        >
                          <option value="">Allocate to...</option>
                          {[app.clusterPref1, app.clusterPref2].map((cid: number) => {
                            const c = clusters.find((x: any) => x.id === cid);
                            return c ? (
                              <option key={cid} value={cid}>{c.name.slice(0, 25)}</option>
                            ) : null;
                          })}
                        </UISelect>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">{app.allocatedName}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
