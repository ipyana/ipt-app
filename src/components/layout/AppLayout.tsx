"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconBar } from "@/components/layout/IconBar";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
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
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-xs text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <IconBar role={role} />
      <ContextSidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onLogout={handleLogout} />
      <MobileNav role={role} open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
      <TopNav user={user} onMenuToggle={() => setMobileOpen(true)} />
      <main
        className={cn(
          "pt-12 transition-all duration-200 ease-in-out",
          collapsed ? "pl-14" : "pl-[190px]",
          "max-lg:pl-14"
        )}
      >
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
