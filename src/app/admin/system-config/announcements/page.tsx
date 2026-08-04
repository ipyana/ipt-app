"use client";

import { SystemConfigPage } from "@/components/system-config/SystemConfigPage";
import { AnnouncementsConfig } from "@/components/system-config/AnnouncementsConfig";

export default function Page() {
  return (
    <SystemConfigPage role="admin" title="Announcements" description="All cluster announcements posted by facilitators">
      <AnnouncementsConfig />
    </SystemConfigPage>
  );
}
