"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, ChevronDown } from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

interface MobileNavProps {
  role: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const navMap: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    {
      label: "My Application",
      children: [
        { label: "Apply", href: "/student/apply" },
        { label: "Re-apply", href: "/student/reapply" },
        { label: "Transfer", href: "/student/transfer" },
      ],
    },
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

export function MobileNav({ role, open, onClose, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navMap[role] || navMap.admin;
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "My Application": true,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl lg:hidden"
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-bold text-foreground">CoICT — IPT</span>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-sidebar-hover">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="p-2 space-y-0.5 overflow-y-auto" style={{ height: "calc(100% - 100px)" }}>
              {items.map((item) => {
                if (item.children) {
                  const openMenu = expandedMenus[item.label] !== false;
                  return (
                    <div key={item.label} className="space-y-0.5">
                      <button
                        onClick={() => setExpandedMenus((p) => ({ ...p, [item.label]: !openMenu }))}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-sidebar-hover dark:text-slate-400"
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", openMenu ? "rotate-0" : "-rotate-90")} />
                      </button>
                      {openMenu && item.children.map((child) => {
                        const active = pathname === child.href;
                        return (
                          <button
                            key={child.href}
                            onClick={() => { router.push(child.href!); onClose(); }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md px-3 py-1.5 pl-6 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                                : "text-slate-500 hover:bg-sidebar-hover dark:text-slate-400"
                            )}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                const active = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href!); onClose(); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                        : "text-slate-600 hover:bg-sidebar-hover dark:text-slate-400"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
