"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Upload,
  Users,
  BarChart3,
  Layers,
  Shield,
  Move,
  Settings,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IconItem {
  key: string;
  icon: React.ElementType;
  href: string;
}

interface IconBarProps {
  role: string;
}

const iconMap: Record<string, IconItem[]> = {
  student: [
    { key: "dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
    { key: "apply", icon: ClipboardList, href: "/student/apply" },
    { key: "status", icon: FileText, href: "/student/status" },
    { key: "report", icon: Upload, href: "/student/report" },
  ],
  admin: [
    { key: "overview", icon: BarChart3, href: "/admin/dashboard" },
    { key: "students", icon: Users, href: "/admin/students" },
    { key: "clusters", icon: Layers, href: "/admin/clusters" },
    { key: "email", icon: Mail, href: "/admin/email" },
    { key: "settings", icon: Settings, href: "/super-admin/settings" },
  ],
  super_admin: [
    { key: "overview", icon: BarChart3, href: "/super-admin" },
    { key: "admins", icon: Shield, href: "/super-admin/admins" },
    { key: "staff", icon: Users, href: "/super-admin/staff" },
    { key: "transfers", icon: Move, href: "/super-admin/transfers" },
    { key: "settings", icon: Settings, href: "/super-admin/settings" },
  ],
  staff: [
    { key: "dashboard", icon: LayoutDashboard, href: "/staff" },
  ],
};

export function IconBar({ role }: IconBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const icons = iconMap[role] || iconMap.admin;

  function isActive(href: string) {
    if (href === "/super-admin") return pathname.startsWith("/super-admin");
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-14 flex-col items-center border-r border-border bg-sidebar py-2">
      <button onClick={() => router.push("/")} className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-sidebar-hover transition-colors">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/must_Logo.png" alt="MUST" className="h-7 w-7 object-contain" />
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {icons.map((item) => {
          const active = isActive(item.href);
          return (
            <motion.button
              key={item.key}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-600 dark:hover:text-slate-300"
              )}
              whileTap={{ scale: 0.9 }}
              title={item.key}
            >
              {active && (
                <motion.div
                  layoutId="icon-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary-500"
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                />
              )}
              <item.icon className="h-5 w-5" />
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1 pb-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
