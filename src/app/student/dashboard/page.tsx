"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, CheckCircle, Clock, GraduationCap,
  BookOpen, MapPin, Users, ArrowRight, AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ClusterProgram { program: { id: number; name: string }; slots: number; enrolled: number }
interface Cluster {
  id: number; name: string; description: string; capacity: number;
  currentEnrolled: number; location: string;
  allowedPrograms: ClusterProgram[];
  staff: { name: string }[];
}

interface Application { id: number; status: string; allocatedCluster: number | null }

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/clusters").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ])
      .then(([u, c, a]) => {
        setUser(u);
        setClusters(Array.isArray(c) ? c : []);
        if (a && a.id) setApplication(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c.name]));
  const allocatedName = application?.allocatedCluster ? clusterMap[application.allocatedCluster] : null;

  const eligibleClusters = clusters.filter((c) =>
    c.allowedPrograms?.some((cp) => cp.slots > 0 && cp.program.name === user?.program)
  );

  function getProgramSlot(cluster: Cluster) {
    const cp = cluster.allowedPrograms?.find((p) => p.program.name === user?.program);
    return cp || null;
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <AppLayout role="student">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.fullName?.split(" ")[0]}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {user?.studentId} · {user?.department} · {user?.program}
            </p>
          </div>
          {!application && (
            <Button onClick={() => router.push("/student/apply")} size="lg">
              <ClipboardList className="h-4 w-4" /> Start Application
            </Button>
          )}
        </div>

        {application ? (
          <Card className="border-l-4 border-l-primary-600 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                  {application.status === "allocated" ? <CheckCircle className="h-6 w-6 text-emerald-600" /> : <Clock className="h-6 w-6 text-amber-600" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    {application.status === "allocated" ? "Allocated!" : "Application Under Review"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {application.status === "allocated" ? `You have been allocated to ${allocatedName}.` : "Your preferences have been submitted."}
                  </p>
                  {application.status === "allocated" && allocatedName && (
                    <Badge variant="success" className="mt-3 text-sm px-3 py-1">{allocatedName}</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/student/status")}>View Details <ArrowRight className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10 animate-fade-in">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
                  <AlertCircle className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Application Yet</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Browse the available IPT clusters for your program ({user?.program}) and select your top 3 preferences.
              </p>
              <Button className="mt-6" size="lg" onClick={() => router.push("/student/apply")}>
                <ClipboardList className="h-4 w-4" /> Select Clusters
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="Available Clusters" value={eligibleClusters.length.toString()} sub={`for ${user?.program?.slice(0, 25) || "your program"}`} />
          <StatCard icon={Users} label="Total Capacity" value={eligibleClusters.reduce((s, c) => s + (getProgramSlot(c)?.slots || 0), 0).toString()} sub="program slots" />
          <StatCard icon={GraduationCap} label="Program" value={user?.program?.split(".").pop()?.trim() || "—"} sub={user?.department || ""} />
          <StatCard icon={CheckCircle} label="Status" value={application ? (application.status === "allocated" ? "Allocated" : "Pending") : "Not Applied"} sub={application ? "Submitted" : "Action needed"} variant={application?.status === "allocated" ? "success" : application ? "warning" : "default"} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Available Clusters for {user?.program}</h3>
            <span className="text-sm text-slate-400">{eligibleClusters.length} clusters</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eligibleClusters.map((cluster) => {
              const cp = getProgramSlot(cluster)!;
              const pct = Math.round((cp.enrolled / cp.slots) * 100);
              return (
                <Card key={cluster.id} className="group cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200" onClick={() => router.push("/student/apply")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base pr-8">{cluster.name}</CardTitle>
                      <Badge variant="success" className="shrink-0">Available</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-500 line-clamp-2">{cluster.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Slots for {user?.program?.slice(0, 18)}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{cp.enrolled} / {cp.slots}</span>
                      </div>
                      <Progress value={cp.enrolled} max={cp.slots} size="sm" variant={pct > 90 ? "danger" : pct > 70 ? "warning" : "primary"} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cluster.location}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cluster.staff.length} staff</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {eligibleClusters.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-400">No clusters have been allocated for {user?.program} yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub, variant = "default" }: { icon: React.ElementType; label: string; value: string; sub: string; variant?: "default" | "success" | "warning" }) {
  const colors: any = {
    default: "border-primary-100 dark:border-primary-800",
    success: "border-emerald-100 dark:border-emerald-800",
    warning: "border-amber-100 dark:border-amber-800",
  };
  const iconColors: any = {
    default: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <Card className={colors[variant]}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColors[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] text-slate-400">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <AppLayout role="student">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div><Skeleton className="h-10 w-40" /></div>
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24" />))}</div>
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-48" />))}</div>
      </div>
    </AppLayout>
  );
}
