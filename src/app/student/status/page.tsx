"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import {
  Clock,
  Calendar,
  MapPin,
  Edit3,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudentStatus() {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [clusters, setClusters] = useState<Record<number, string>>({});
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
          <p className="text-sm text-slate-500 mt-2">Submit your cluster preferences to get started.</p>
          <Button className="mt-6" onClick={() => router.push("/student/apply")}>
            Go to Application
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusIndex = application.status === "allocated" ? 2 : application.status === "pending" ? 1 : 0;

  const preferences = [
    { label: "1st Choice", key: "clusterPref1", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
    { label: "2nd Choice", key: "clusterPref2", color: "text-slate-600 bg-slate-50 dark:bg-slate-700/50 dark:text-slate-300" },
    { label: "3rd Choice", key: "clusterPref3", color: "text-slate-500 bg-slate-50 dark:bg-slate-700/50 dark:text-slate-300" },
  ];

  return (
    <AppLayout role="student">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Application
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            Submitted {new Date(application.submissionDate).toLocaleDateString("en-KE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Steps
              steps={[
                { label: "Submitted" },
                { label: "Reviewing" },
                { label: "Allocated" },
              ]}
              current={statusIndex}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferences.map(({ label, key, color }) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * preferences.indexOf({ label, key, color }) }}
                className="flex items-center justify-between rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <Badge className={color}>
                  {clusters[application[key]] || "Unknown"}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {application.allocatedCluster && clusters[application.allocatedCluster] && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Allocated Cluster</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {clusters[application.allocatedCluster]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {application.status === "pending" && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/student/apply")}>
              <Edit3 className="h-4 w-4" />
              Modify Preferences
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
