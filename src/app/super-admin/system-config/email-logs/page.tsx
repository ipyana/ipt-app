"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { EmailLogsConfig } from "@/components/system-config/EmailLogsConfig";

export default function SuperAdminSystemConfigEmailLogs() {
  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Delivery history for all outgoing emails</p>
        </div>
        <EmailLogsConfig />
      </div>
    </AppLayout>
  );
}
