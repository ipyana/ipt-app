"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Layers,
  Users,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, allocated: 0, byDept: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clusters").then((r) => r.json()),
      fetch("/api/admin/applications").then((r) => r.json()),
    ])
      .then(([c, apps]) => {
        setClusters(Array.isArray(c) ? c : []);
        const stats = { total: 0, pending: 0, allocated: 0, byDept: {} as Record<string, number> };
        if (Array.isArray(apps)) {
          stats.total = apps.length;
          stats.pending = apps.filter((a: any) => a.status === "pending").length;
          stats.allocated = apps.filter((a: any) => a.status === "allocated").length;
          apps.forEach((a: any) => {
            const d = a.student?.department || "Unknown";
            stats.byDept[d] = (stats.byDept[d] || 0) + 1;
          });
        }
        setSummary(stats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Overview</h2>
          <p className="text-sm text-slate-500 mt-1">IPT Application Management Dashboard</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="Total Applications" value={summary.total} color="blue" loading={loading} />
          <StatCard icon={Clock} label="Pending" value={summary.pending} color="amber" loading={loading} />
          <StatCard icon={CheckCircle} label="Allocated" value={summary.allocated} color="emerald" loading={loading} />
          <StatCard icon={Layers} label="Clusters" value={clusters.length} color="indigo" loading={loading} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Applications by Department</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(summary.byDept)
                  .sort(([, a], [, b]) => b - a)
                  .map(([dept, count]) => {
                    const pct = summary.total ? (count / summary.total) * 100 : 0;
                    const colors: Record<string, string> = {
                      ETE: "bg-teal-500",
                      IST: "bg-sky-500",
                      IF: "bg-violet-500",
                      CSE: "bg-amber-500",
                      CoSTE: "bg-rose-500",
                    };
                    return (
                      <div key={dept} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16 text-slate-700 dark:text-slate-300">{dept}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colors[dept] || "bg-primary-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-500 w-8 text-right font-medium">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Cluster Capacity Utilization</h3>
              </div>
              <div className="space-y-4">
                {clusters.map((c) => {
                  const pct = Math.round((c.currentEnrolled / c.capacity) * 100);
                  const variant = pct > 90 ? "danger" : pct > 70 ? "warning" : "primary";
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[65%]">{c.name}</span>
                        <span className="text-slate-400">{c.currentEnrolled}/{c.capacity}</span>
                      </div>
                      <Progress value={c.currentEnrolled} max={c.capacity} size="default" variant={variant as any} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "amber" | "emerald" | "indigo";
  loading: boolean;
}) {
  const bgMap = {
    blue: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "—" : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
