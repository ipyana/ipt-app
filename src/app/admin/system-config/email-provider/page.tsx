"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { EmailProviderConfig } from "@/components/system-config/EmailProviderConfig";

export default function AdminSystemConfigEmailProvider() {
  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Provider</h2>
          <p className="text-sm text-slate-500 mt-1">SMTP delivery and file storage (MinIO / S3) configuration</p>
        </div>
        <EmailProviderConfig />
      </div>
    </AppLayout>
  );
}
