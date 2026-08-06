"use client";

import { useRegisterSW } from "@/lib/pwa";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export function PWA() {
  useRegisterSW();
  return <PWAInstallPrompt />;
}
