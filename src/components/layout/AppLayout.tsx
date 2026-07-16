"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  role: "student" | "admin" | "staff" | "super_admin";
}

const ADMIN_ROLES = ["admin", "super_admin", "coordinator"];

export function AppLayout({ children, role }: AppLayoutProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const expectedRole = role === "admin" ? ADMIN_ROLES : [role];
        if (data.error || !expectedRole.includes(data.role)) {
          router.push("/");
        } else {
          setUser(data);
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router, role]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950">
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onLogout={handleLogout} />
      <MobileNav role={role} open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
      <TopNav user={user} collapsed={collapsed} onMenuToggle={() => setMobileOpen(true)} />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          collapsed ? "pl-[72px]" : "pl-64",
          "max-lg:pl-0"
        )}
      >
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
