"use client";

import { SystemConfigPage } from "@/components/system-config/SystemConfigPage";
import { SessionConfig } from "@/components/system-config/SessionConfig";

export default function Page() {
  return (
    <SystemConfigPage role="super_admin" title="IPT Session" description="Configure IPT session dates and phase schedule">
      <SessionConfig />
    </SystemConfigPage>
  );
}
