"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm text-center"
      >
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/must_Logo.png" alt="MUST Logo" className="h-24 w-24 object-contain" />
        </div>
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
            <WifiOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">You are offline</h1>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          {online
            ? "Reconnecting..."
            : "No internet connection. Your cached data is available, but live updates need a connection."}
        </p>
        <Button className="w-full h-10" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </motion.div>
    </div>
  );
}
