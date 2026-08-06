"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogOut, ChevronDown } from "lucide-react";
import { navMap, NavItem } from "@/lib/nav";
import { navIcon } from "@/lib/navIcons";

interface SidebarProps {
  role: string;
  userRole?: string;
  onLogout: () => void;
  isMobile?: boolean;
  onNavigate?: () => void;
}

const COORDINATOR_BLOCKED = [
  "/admin/system-config/email-provider",
  "/admin/system-config/email-templates",
  "/admin/system-config/email-logs",
];

function filterItems(items: NavItem[], role: string): NavItem[] {
  if (role !== "coordinator") return items;
  return items
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((c) => !COORDINATOR_BLOCKED.includes(c.href || ""));
        return children.length > 0 ? { ...item, children } : null;
      }
      return item;
    })
    .filter((item): item is NavItem => !!item);
}

export function Sidebar({ role, userRole, onLogout, isMobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const effectiveRole = userRole || role;
  const items = filterItems(navMap[effectiveRole] || navMap.admin, effectiveRole);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of items) {
      if (item.children?.some((c) => isActive(c.href))) init[item.label] = true;
    }
    return init;
  });

  function isActive(href?: string) {
    if (!href) return false;
    if (href === "/super-admin") return pathname.startsWith("/super-admin");
    return pathname === href || pathname.startsWith(href);
  }

  function navigate(href: string) {
    router.push(href);
    onNavigate?.();
  }

  function toggleGroup(label: string) {
    setOpenGroups((p) => ({ ...p, [label]: !p[label] }));
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <button onClick={() => navigate("/")} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/must_Logo.png" alt="MUST" className="h-6 w-6 object-contain" />
        </button>
        <span className="text-sm font-bold text-foreground truncate">MUST — IPT</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          if (item.children) {
            const open = openGroups[item.label] !== false;
            const childActive = item.children.some((c) => isActive(c.href));
            const Icon = navIcon(item.icon);
            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    childActive
                      ? "text-primary-700 dark:text-primary-400"
                      : "text-slate-600 hover:bg-sidebar-hover dark:text-slate-400"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")} />
                </button>
                {open && (
                  <div className="space-y-0.5">
                    {item.children.map((child) => (
                      <button
                        key={child.href}
                        onClick={() => navigate(child.href!)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 pl-9 text-sm font-medium transition-colors",
                          isActive(child.href)
                            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                            : "text-slate-500 hover:bg-sidebar-hover dark:text-slate-400"
                        )}
                      >
                        <span className="truncate">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          const active = isActive(item.href);
          const Icon = navIcon(item.icon);
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href!)}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-slate-600 hover:bg-sidebar-hover dark:text-slate-400"
              )}
            >
              {active && (
                <motion.span
                  layoutId={`nav-active-${isMobile ? "m" : "d"}`}
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-primary-500"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
