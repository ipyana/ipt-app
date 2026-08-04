"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ReapplicationsConfig } from "@/components/system-config/ReapplicationsConfig";

export default function AdminReapplications() {
  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Re-applications</h2>
          <p className="text-sm text-slate-500 mt-1">Full reapplication requests (students changing both cluster preferences)</p>
        </div>
        <ReapplicationsConfig />
      </div>
    </AppLayout>
  );
}
