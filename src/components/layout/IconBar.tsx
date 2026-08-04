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
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navMap, NavItem } from "@/lib/nav";

interface IconItem {
  key: string;
  icon: React.ElementType;
  href: string;
}

interface IconBarProps {
  role: string;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function itemToIcon(item: NavItem): IconItem | null {
  if (!item.href) return null;
  return { key: item.label, icon: item.href.includes("dashboard") || item.href === "/student/dashboard" ? LayoutDashboard : item.href.includes("apply") || item.href.includes("status") ? ClipboardList : item.href.includes("report") || item.href.includes("export") ? Upload : item.href.includes("students") ? Users : item.href.includes("clusters") ? Layers : item.href.includes("staff") || item.href.includes("admins") ? Shield : item.href.includes("transfers") ? Move : item.href.includes("settings") || item.href.includes("system-config") ? Settings : item.href.includes("email") ? Mail : item.href.includes("announcements") ? Megaphone : FileText, href: item.href };
}

const iconMap: Record<string, IconItem[]> = Object.fromEntries(
  Object.entries(navMap).map(([role, items]) => {
    const flat = items.map(itemToIcon).filter((x): x is IconItem => !!x);
    const first = flat[0] || { key: "dashboard", icon: LayoutDashboard, href: "/" };
    return [role, flat.length > 1 ? flat : [first]];
  })
);

export function IconBar({ role, onHoverStart, onHoverEnd }: IconBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const icons = iconMap[role] || iconMap.admin;

  function isActive(href: string) {
    if (href === "/super-admin") return pathname.startsWith("/super-admin");
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-14 flex-col items-center border-r border-border bg-sidebar py-2" onMouseEnter={onHoverStart} onMouseLeave={onHoverEnd}>
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
