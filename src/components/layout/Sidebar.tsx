"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Upload,
  Users,
  Target,
  BarChart3,
  Download,
  ChevronLeft,
  LogOut,
  Building2,
  BookOpen,
  Layers,
  Shield,
  List,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Select Clusters", href: "/student/apply", icon: ClipboardList },
  { label: "My Application", href: "/student/status", icon: FileText },
  { label: "Upload Report", href: "/student/report", icon: Upload },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Programs", href: "/admin/programs", icon: BookOpen },
  { label: "Clusters", href: "/admin/clusters", icon: Layers },
  { label: "Allocations", href: "/admin/allocations", icon: Target },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Export Data", href: "/admin/export", icon: Download },
];

const superAdminNav: NavItem[] = [
  { label: "Overview", href: "/super-admin", icon: BarChart3 },
  { label: "Admins", href: "/super-admin/admins", icon: Shield },
  { label: "Staff", href: "/super-admin/staff", icon: Users },
  { label: "Waitlist", href: "/super-admin/waitlist", icon: List },
  { label: "Settings", href: "/super-admin/settings", icon: Settings },
  { label: "Allocations", href: "/admin/allocations", icon: Target },
  { label: "Clusters", href: "/admin/clusters", icon: Layers },
  { label: "Students", href: "/admin/students", icon: BookOpen },
];

const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
];

interface SidebarProps {
  role: string;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export function Sidebar({ role, collapsed, onToggle, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = role === "student" ? studentNav
    : role === "super_admin" ? superAdminNav
    : role === "staff" ? staffNav
    : adminNav;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-900",
        collapsed ? "w-[72px]" : "w-64"
      )}
      aria-label={`${role} navigation`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/must-logo.png" alt="MUST Logo" className="h-9 w-9 object-contain" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            CoICT — IPT
            <br />
            <span className="text-[10px] font-medium text-slate-400">2025/2026</span>
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3" role="navigation">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary-600 dark:text-primary-400")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-700 space-y-1">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-5 w-5 shrink-0 transition-transform duration-300", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
