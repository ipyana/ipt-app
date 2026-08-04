"use client";

import { SystemConfigPage } from "@/components/system-config/SystemConfigPage";
import { EmailTemplatesConfig } from "@/components/system-config/EmailTemplatesConfig";

export default function Page() {
  return (
    <SystemConfigPage role="super_admin" title="Email Templates" description="Customize notification and confirmation emails">
      <EmailTemplatesConfig />
    </SystemConfigPage>
  );
}
