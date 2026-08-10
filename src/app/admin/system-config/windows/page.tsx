"use client";

import { SystemConfigPage } from "@/components/system-config/SystemConfigPage";
import { WindowsConfig } from "@/components/system-config/WindowsConfig";

export default function AdminWindows() {
  return (
    <SystemConfigPage role="admin" title="Application Windows" description="Control when students can apply, transfer, or reapply">
      <WindowsConfig />
    </SystemConfigPage>
  );
}
