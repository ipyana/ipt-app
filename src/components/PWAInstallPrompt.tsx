"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Download, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus, usePWAInstallPrompt } from "@/lib/pwa";

function getIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua);
}

export function PWAInstallPrompt() {
  const online = useOnlineStatus();
  const { canInstall, promptInstall } = usePWAInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(getIOS());
  }, []);

  const showInstall = canInstall && !dismissed && online;
  const showIOSHint = isIOS && !dismissed && online && !canInstall;

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") setStatus("done");
  }

  return (
    <>
      {/* Online/Offline status banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 inset-x-0 z-[80] bg-amber-500 text-white text-center text-xs font-medium py-1.5 flex items-center justify-center gap-1.5"
          >
            <WifiOff className="h-3.5 w-3.5" /> You are offline — showing cached data
          </motion.div>
        )}
        {online && status === "done" && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 inset-x-0 z-[80] bg-emerald-600 text-white text-center text-xs font-medium py-1.5 flex items-center justify-center gap-1.5"
          >
            <Wifi className="h-3.5 w-3.5" /> Installed — launch MUST IPT from your home screen
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install prompt (non-intrusive bottom card) */}
      <AnimatePresence>
        {(showInstall || showIOSHint) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed bottom-0 inset-x-0 z-[75] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden"
          >
            <div className="mx-auto max-w-md rounded-xl border border-border bg-panel shadow-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-192-maskable.png" alt="MUST IPT" className="h-8 w-8 rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Install MUST IPT</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {showIOSHint
                      ? "Tap Share, then \u201cAdd to Home Screen\u201d for the full app experience."
                      : "Get quick access with offline support."}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDismissed(true)} aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setDismissed(true)}>
                  Not now
                </Button>
                {showIOSHint ? (
                  <Button size="sm" className="flex-1" onClick={() => setDismissed(true)}>
                    <Share2 className="h-3.5 w-3.5" /> Got it
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={handleInstall} disabled={status === "done"}>
                    <Download className="h-3.5 w-3.5" /> Install
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
