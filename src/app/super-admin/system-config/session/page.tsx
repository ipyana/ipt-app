"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { SessionConfig } from "@/components/system-config/SessionConfig";

export default function SuperAdminSystemConfigSession() {
  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">IPT Session</h2>
          <p className="text-sm text-slate-500 mt-1">Configure IPT session dates and phase schedule</p>
        </div>
        <SessionConfig />
      </div>
    </AppLayout>
  );
}
