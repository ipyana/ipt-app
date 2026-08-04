"use client";

import { SystemConfigPage } from "@/components/system-config/SystemConfigPage";
import { EmailProviderConfig } from "@/components/system-config/EmailProviderConfig";

export default function Page() {
  return (
    <SystemConfigPage role="super_admin" title="Email Provider" description="SMTP delivery and file storage (MinIO / S3) configuration">
      <EmailProviderConfig />
    </SystemConfigPage>
  );
}
