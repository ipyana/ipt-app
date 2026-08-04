"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { EmailTemplatesConfig } from "@/components/system-config/EmailTemplatesConfig";

export default function SuperAdminSystemConfigEmailTemplates() {
  return (
    <AppLayout role="super_admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Templates</h2>
          <p className="text-sm text-slate-500 mt-1">Customize notification and confirmation emails</p>
        </div>
        <EmailTemplatesConfig />
      </div>
    </AppLayout>
  );
}
