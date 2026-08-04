"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  read: boolean;
  cluster: { id: number; name: string };
  staff: { id: number; name: string };
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (unread > 0 || announcements.length > 0) return;
    fetch("/api/student/announcements")
      .then((r) => r.json())
      .then((d) => {
        setAnnouncements(Array.isArray(d.announcements) ? d.announcements : []);
        setUnread(d.unreadCount || 0);
      })
      .catch(() => {});
  }, [unread, announcements.length]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setLoading(true);
      try {
        await fetch("/api/student/announcements/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const res = await fetch("/api/student/announcements");
        const d = await res.json();
        setAnnouncements(Array.isArray(d.announcements) ? d.announcements : []);
        setUnread(d.unreadCount || 0);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 relative" onClick={toggle} title="Announcements">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-panel">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Announcements</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}><X className="h-3 w-3" /></Button>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {loading && <p className="py-6 text-center text-xs text-slate-400">Loading...</p>}
              {!loading && announcements.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No announcements for your clusters yet</p>
              )}
              {announcements.map((a) => (
                <div key={a.id} className={cn("border-b border-border px-4 py-3", !a.read && "bg-primary-50/50 dark:bg-primary-900/10")}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</p>
                    {!a.read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{a.body}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{a.cluster?.name}</span>
                    {a.attachmentUrl && (
                      <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary-600 hover:underline">
                        <Paperclip className="h-2.5 w-2.5" /> {a.attachmentName || "File"}
                      </a>
                    )}
                    <span>· {new Date(a.createdAt).toLocaleDateString("en-TZ")}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); router.push("/student/dashboard"); }}>
                View Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
