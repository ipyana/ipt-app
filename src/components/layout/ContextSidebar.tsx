"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogOut, Search, ChevronRight, X } from "lucide-react";
import { navMap, NavItem } from "@/lib/nav";

interface ContextSidebarProps {
  role: string;
  collapsed: boolean;
  hovering: boolean;
  contextLabel: string | null;
  onToggle: () => void;
  onHover: (hovering: boolean) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onContext: (label: string | null) => void;
  onLogout: () => void;
}

export function ContextSidebar({ role, collapsed, hovering, contextLabel, onToggle, onHover, onHoverStart, onHoverEnd, onContext, onLogout }: ContextSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navMap[role] || navMap.admin;

  const mainVisible = !collapsed || hovering;

  function isActive(href?: string) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href);
  }

  function openContext(item: NavItem) {
    if (item.children) {
      if (!collapsed) onToggle();
      onContext(item.label);
    } else if (item.href) {
      router.push(item.href);
    }
  }

  const contextItem = items.find((i) => i.label === contextLabel) || null;

  return (
    <>
      {/* Main sidebar panel */}
      <aside
        className={cn(
          "fixed left-14 top-0 z-40 h-full border-r border-border bg-sidebar transition-all duration-200 ease-in-out overflow-hidden flex flex-col",
          mainVisible ? "w-56" : "w-0"
        )}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      >
        <div className={cn("flex flex-col h-full", !mainVisible && "invisible")} style={{ width: "224px" }}>
          <div className="flex h-12 items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-xs text-slate-400">Search pages...</span>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {items.map((item) => {
              const active = isActive(item.href) || (item.children ? item.children.some((c) => isActive(c.href)) : false);
              return (
                <button
                  key={item.label}
                  onClick={() => openContext(item)}
                  className={cn(
                    "relative flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                      : "text-slate-600 hover:bg-sidebar-hover hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-primary-500"
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                  {item.children && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                </button>
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

      {/* Context flyout panel (open submenu beside the collapsed rail) */}
      <AnimatePresence>
        {contextItem && contextItem.children && (
          <motion.aside
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="fixed left-14 top-0 z-40 h-full w-56 border-r border-border bg-sidebar shadow-xl flex flex-col"
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{contextItem.label}</span>
              <button onClick={() => onContext(null)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-sidebar-hover">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {contextItem.children.map((child) => {
                const active = isActive(child.href);
                return (
                  <button
                    key={child.href}
                    onClick={() => {
                      router.push(child.href!);
                      onContext(null);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                        : "text-slate-500 hover:bg-sidebar-hover hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    {child.label}
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
