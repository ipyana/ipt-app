"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogOut, ChevronRight } from "lucide-react";
import { navMap, NavItem } from "@/lib/nav";
import { navIcon } from "@/lib/navIcons";

interface SidebarProps {
  role: string;
  onLogout: () => void;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ role, onLogout, isMobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navMap[role] || navMap.admin;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSection(null);
    setOpenGroups({});
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActiveSection(null);
      }
    }
    if (!isMobile) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isMobile]);

  function isActive(href?: string) {
    if (!href) return false;
    if (href === "/super-admin") return pathname.startsWith("/super-admin");
    return pathname === href || pathname.startsWith(href);
  }

  function navigate(href: string) {
    router.push(href);
    setActiveSection(null);
    onNavigate?.();
  }

  function toggleSection(item: NavItem) {
    if (item.children) {
      setActiveSection((cur) => (cur === item.label ? null : item.label));
      setOpenGroups({});
    } else if (item.href) {
      navigate(item.href);
    }
  }

  function toggleGroup(label: string) {
    setOpenGroups((p) => ({ ...p, [label]: !p[label] }));
  }

  // Mobile: full-width drawer with everything listed
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-12 items-center border-b border-border px-4">
          <span className="text-sm font-bold text-foreground">MUST — IPT</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map((item) => {
            if (item.children) {
              const open = openGroups[item.label] !== false;
              const childActive = item.children.some((c) => isActive(c.href));
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
                    <span className="flex items-center gap-2">
                      {(() => { const I = navIcon(item.icon); return <I className="h-4 w-4" />; })()}
                      {item.label}
                    </span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", open ? "rotate-90" : "")} />
                  </button>
                  {open && item.children.map((child) => (
                    <button
                      key={child.href}
                      onClick={() => navigate(child.href!)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-1.5 pl-8 text-sm font-medium transition-colors",
                        isActive(child.href)
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                          : "text-slate-500 hover:bg-sidebar-hover dark:text-slate-400"
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              );
            }
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href!)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-slate-600 hover:bg-sidebar-hover dark:text-slate-400"
                )}
              >
                <span className="flex items-center gap-2">
                  {(() => { const I = navIcon(item.icon); return <I className="h-4 w-4" />; })()}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Desktop: icon rail + dropdown panel
  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <aside className="flex w-14 flex-col items-center border-r border-border bg-sidebar py-2">
        <button onClick={() => navigate("/")} className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-sidebar-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/must_Logo.png" alt="MUST" className="h-7 w-7 object-contain" />
        </button>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {items.map((item) => {
            const active = isActive(item.href) || (item.children ? item.children.some((c) => isActive(c.href)) : false);
            const sectionOpen = activeSection === item.label;
            return (
              <button
                key={item.label}
                onClick={() => toggleSection(item)}
                title={item.label}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  sectionOpen || active
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {active && !sectionOpen && (
                  <motion.span layoutId="icon-active" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary-500" />
                )}
                {(() => { const I = navIcon(item.icon); return <I className="h-5 w-5" />; })()}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-1 pb-2">
          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Dropdown panel */}
      <AnimatePresence>
        {activeSection && (
          <motion.aside
            ref={panelRef}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="h-full w-56 overflow-y-auto border-r border-border bg-sidebar"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{activeSection}</p>
            </div>
            <nav className="space-y-0.5 p-2">
              {items.find((i) => i.label === activeSection)?.children?.map((child) => (
                <button
                  key={child.href}
                  onClick={() => navigate(child.href!)}
                  className={cn(
                    "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(child.href)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                      : "text-slate-500 hover:bg-sidebar-hover dark:text-slate-400"
                  )}
                >
                  {child.label}
                </button>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
