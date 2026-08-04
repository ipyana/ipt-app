"use client";

import { SystemConfigPage } from "@/components/system-config/SystemConfigPage";
import { EmailLogsConfig } from "@/components/system-config/EmailLogsConfig";

export default function Page() {
  return (
    <SystemConfigPage role="super_admin" title="Email Logs" description="Delivery history for all outgoing emails">
      <EmailLogsConfig />
    </SystemConfigPage>
  );
}
