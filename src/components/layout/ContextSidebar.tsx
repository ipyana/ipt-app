"use client";

import { usePathname, useRouter } from "next/navigation";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogOut, Search } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

interface ContextSidebarProps {
  role: string;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const navMap: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Select Clusters", href: "/student/apply" },
    { label: "My Application", href: "/student/status" },
    { label: "Upload Report", href: "/student/report" },
  ],
  admin: [
    { label: "Overview", href: "/admin/dashboard" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Programs", href: "/admin/programs" },
    { label: "Clusters", href: "/admin/clusters" },
    { label: "Allocations", href: "/admin/allocations" },
    { label: "Students", href: "/admin/students" },
    { label: "Export Data", href: "/admin/export" },
    { label: "Email", href: "/admin/email" },
  ],
  super_admin: [
    { label: "Overview", href: "/super-admin" },
    { label: "Admins", href: "/super-admin/admins" },
    { label: "Staff", href: "/super-admin/staff" },
    { label: "Waitlist", href: "/super-admin/waitlist" },
    { label: "Transfers", href: "/super-admin/transfers" },
    { label: "Settings", href: "/super-admin/settings" },
    { label: "Allocations", href: "/admin/allocations" },
    { label: "Clusters", href: "/admin/clusters" },
    { label: "Students", href: "/admin/students" },
  ],
  staff: [
    { label: "Dashboard", href: "/staff" },
  ],
};

const sidebarVariants = cva(
  "fixed left-14 top-0 z-40 h-full border-r border-border bg-sidebar transition-all duration-200 ease-in-out overflow-hidden flex flex-col",
  {
    variants: {
      state: {
        expanded: "w-56",
        collapsed: "w-0",
      },
    },
    defaultVariants: { state: "expanded" },
  }
);

export function ContextSidebar({ role, collapsed, onToggle, onLogout }: ContextSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navMap[role] || navMap.admin;

  return (
    <aside className={sidebarVariants({ state: collapsed ? "collapsed" : "expanded" })}>
      <div className={cn("flex flex-col h-full", collapsed ? "invisible" : "visible")} style={{ width: "224px" }}>
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="text-xs text-slate-400">Search pages...</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/super-admin" && pathname.startsWith(item.href) && item.href !== "/");
            return (
              <motion.button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-slate-600 hover:bg-sidebar-hover hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                whileTap={{ scale: 0.98 }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-primary-500"
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-sidebar-hover hover:text-slate-600 transition-colors"
              title="Collapse sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
