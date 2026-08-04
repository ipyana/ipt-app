"use client";

import { useState, useEffect, useRef } from "react";
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
  const [hovering, setHovering] = useState(false);
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  }

  function handleToggle() {
    setCollapsed((c) => !c);
    if (contextLabel) setContextLabel(null);
  }

  function startHover() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovering(true);
  }

  function endHover() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovering(false), 160);
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

  const showSidebar = !collapsed || hovering || !!contextLabel;

  return (
    <div className="min-h-screen bg-surface">
      <IconBar role={role} onHoverStart={startHover} onHoverEnd={endHover} />
      <ContextSidebar
        role={role}
        collapsed={!showSidebar}
        hovering={hovering}
        contextLabel={contextLabel}
        onToggle={handleToggle}
        onHover={setHovering}
        onHoverStart={startHover}
        onHoverEnd={endHover}
        onContext={setContextLabel}
        onLogout={handleLogout}
      />
      <MobileNav role={role} open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
      <TopNav user={user} onMenuToggle={() => setMobileOpen(true)} />
      <main
        className={cn(
          "pt-12 transition-all duration-200 ease-in-out",
          collapsed && !contextLabel ? "pl-14" : "pl-[190px]",
          "max-lg:pl-14"
        )}
      >
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
