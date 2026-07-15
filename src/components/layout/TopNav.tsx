"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopNavProps {
  user: { fullName?: string; username?: string; studentId?: string; role: string } | null;
  collapsed: boolean;
  onMenuToggle: () => void;
}

export function TopNav({ user, collapsed, onMenuToggle }: TopNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const displayName = user?.fullName || user?.username || "User";
  const displayId = user?.studentId || "";
  const isDark = resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/80",
        collapsed ? "left-[72px]" : "left-64"
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/must-logo.png" alt="MUST Logo" className="h-7 w-7 object-contain shrink-0" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              CoICT — IPT 2025/2026
            </h1>
            <p className="text-[10px] text-slate-400">Industrial Practical Training</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}

        <Button variant="ghost" size="icon" aria-label="Notifications" className="text-slate-500">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
              {displayName}
            </p>
            {displayId && (
              <p className="text-xs text-slate-400">{displayId}</p>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-900/40 dark:text-primary-400">
            {user?.role === "admin" ? "A" : displayName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
