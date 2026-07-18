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
  LogOut,
  X,
  Building2,
  BookOpen,
  Layers,
  Shield,
  List,
  Settings,
  Move,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  role: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const studentNav = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Select Clusters", href: "/student/apply", icon: ClipboardList },
  { label: "My Application", href: "/student/status", icon: FileText },
  { label: "Upload Report", href: "/student/report", icon: Upload },
];

const adminNav = [
  { label: "Overview", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Programs", href: "/admin/programs", icon: BookOpen },
  { label: "Clusters", href: "/admin/clusters", icon: Layers },
  { label: "Allocations", href: "/admin/allocations", icon: Target },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Export Data", href: "/admin/export", icon: Download },
  { label: "Email", href: "/admin/email", icon: Mail },
];

const superAdminNav = [
  { label: "Overview", href: "/super-admin", icon: BarChart3 },
  { label: "Admins", href: "/super-admin/admins", icon: Shield },
  { label: "Staff", href: "/super-admin/staff", icon: Users },
  { label: "Waitlist", href: "/super-admin/waitlist", icon: List },
  { label: "Transfers", href: "/super-admin/transfers", icon: Move },
  { label: "Settings", href: "/super-admin/settings", icon: Settings },
  { label: "Allocations", href: "/admin/allocations", icon: Target },
  { label: "Clusters", href: "/admin/clusters", icon: Layers },
  { label: "Students", href: "/admin/students", icon: BookOpen },
];

const staffNav = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
];

export function MobileNav({ role, open, onClose, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = role === "student" ? studentNav
    : role === "super_admin" ? superAdminNav
    : role === "staff" ? staffNav
    : adminNav;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden dark:bg-slate-900",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-900 dark:text-white">CoICT — IPT</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); onClose(); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-3 dark:border-slate-700">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
