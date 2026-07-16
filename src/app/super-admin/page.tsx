"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Shield, Users, GraduationCap, Layers, Clock, CheckCircle,
  AlertTriangle, TrendingUp, List,
} from "lucide-react";

export default function SuperAdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/applications").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
    ])
      .then(([apps, clusters]) => {
        const list = Array.isArray(apps) ? apps : [];
        const cls = Array.isArray(clusters) ? clusters : [];
        setStats({
          totalApps: list.length,
          allocated: list.filter((a: any) => a.status === "allocated").length,
          pending: list.filter((a: any) => a.status === "pending").length,
          waitlisted: list.filter((a: any) => a.status === "waitlisted").length,
          clusters: cls.length,
          totalCapacity: cls.reduce((s: number, c: any) => s + c.capacity, 0),
          totalEnrolled: cls.reduce((s: number, c: any) => s + c.currentEnrolled, 0),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: Users, label: "Total Applications", value: stats?.totalApps || 0, color: "blue" },
    { icon: CheckCircle, label: "Allocated", value: stats?.allocated || 0, color: "emerald" },
    { icon: Clock, label: "Pending", value: stats?.pending || 0, color: "amber" },
    { icon: AlertTriangle, label: "Waitlisted", value: stats?.waitlisted || 0, color: "rose" },
    { icon: Layers, label: "Clusters", value: stats?.clusters || 0, color: "indigo" },
    { icon: TrendingUp, label: "Capacity Used", value: stats ? `${Math.round((stats.totalEnrolled / Math.max(stats.totalCapacity, 1)) * 100)}%` : "—", color: "purple" },
  ];

  const navItems = [
    { label: "Manage Admins", desc: "Create and manage admin accounts", path: "/super-admin/admins", icon: Shield },
    { label: "Manage Staff", desc: "CRUD staff, move between clusters", path: "/super-admin/staff", icon: Users },
    { label: "Waitlist", desc: "Review and approve waitlisted students", path: "/super-admin/waitlist", icon: List },
    { label: "Settings", desc: "Configure IPT session dates", path: "/super-admin/settings", icon: Layers },
    { label: "Allocations", desc: "Manual allocation overrides", path: "/admin/allocations", icon: CheckCircle },
  ];

  return (
    <AppLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Super Admin</h2>
          <p className="text-sm text-slate-500 mt-1">System-wide management dashboard</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((c) => {
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
                indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
                purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
              };
              return (
                <Card key={c.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[c.color]}`}>
                        <c.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{c.label}</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{c.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => (
            <button key={item.path} onClick={() => router.push(item.path)}
              className="flex items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all hover:border-primary-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-700">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <item.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{item.label}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
