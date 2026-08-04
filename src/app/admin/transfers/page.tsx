"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { TransfersConfig } from "@/components/system-config/TransfersConfig";

export default function AdminTransfers() {
  return (
    <AppLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transfers</h2>
          <p className="text-sm text-slate-500 mt-1">Single-cluster transfer requests (students swapping one cluster)</p>
        </div>
        <TransfersConfig />
      </div>
    </AppLayout>
  );
}
