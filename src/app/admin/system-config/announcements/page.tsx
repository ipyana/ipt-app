"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { AnnouncementsConfig } from "@/components/system-config/AnnouncementsConfig";

export default function AdminSystemConfigAnnouncements() {
  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Announcements</h2>
          <p className="text-sm text-slate-500 mt-1">All cluster announcements posted by facilitators</p>
        </div>
        <AnnouncementsConfig />
      </div>
    </AppLayout>
  );
}
