"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface TopNavProps {
  user: { fullName?: string; username?: string; studentId?: string; role: string } | null;
  onMenuToggle: () => void;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  apply: "Select Clusters",
  status: "My Application",
  report: "Upload Report",
  overview: "Overview",
  departments: "Departments",
  programs: "Programs",
  clusters: "Clusters",
  allocations: "Allocations",
  students: "Students",
  export: "Export Data",
  email: "Email",
  admins: "Admins",
  staff: "Staff",
  waitlist: "Waitlist",
  transfers: "Transfers",
  settings: "Settings",
};

function getBreadcrumb(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: string[] = [];
  for (const p of parts) {
    if (p === "admin") crumbs.push("Admin");
    else if (p === "super-admin") crumbs.push("Super Admin");
    else if (p === "student") crumbs.push("Student");
    else if (routeLabels[p]) crumbs.push(routeLabels[p]);
    else crumbs.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  return crumbs;
}

export function TopNav({ user, onMenuToggle }: TopNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const displayName = user?.fullName || user?.username || "User";
  const displayId = user?.studentId || "";
  const breadcrumbs = getBreadcrumb(pathname);

  return (
    <header className="fixed top-0 right-0 z-30 flex h-12 items-center justify-between border-b border-border bg-panel/80 backdrop-blur-md px-4 left-14">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden h-8 w-8">
          <Menu className="h-4 w-4" />
        </Button>
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
              <span className={cn(
                "font-medium",
                i === breadcrumbs.length - 1 ? "text-foreground" : "text-slate-400"
              )}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        {mounted && <ThemeToggle compact />}

        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
          <Bell className="h-4 w-4" />
        </Button>

        <motion.div
          className="flex items-center gap-2.5 pl-3 border-l border-border ml-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-foreground leading-tight">{displayName}</p>
            {displayId && <p className="text-[10px] text-slate-400">{displayId}</p>}
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold dark:bg-primary-900/40 dark:text-primary-400">
            {["admin", "super_admin", "coordinator"].includes(user?.role || "")
              ? user?.role === "super_admin" ? "SA" : user?.role === "coordinator" ? "C" : "A"
              : displayName.charAt(0)}
          </div>
        </motion.div>
      </div>
    </header>
  );
}
