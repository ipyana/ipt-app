"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StaffTransfersConfig } from "@/components/system-config/StaffTransfersConfig";

export default function SuperAdminStaffTransfers() {
  return (
    <AppLayout role="super_admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Staff Transfers</h2>
          <p className="text-sm text-slate-500 mt-1">Cluster transfer requests from facilitators, approved by the coordinator</p>
        </div>
        <StaffTransfersConfig />
      </div>
    </AppLayout>
  );
}
