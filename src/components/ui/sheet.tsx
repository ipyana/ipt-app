"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right" | "bottom";
  className?: string;
  title?: string;
}

export function Sheet({ open, onClose, children, side = "right", className, title }: SheetProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const variants: Record<string, { x?: string; y?: string; enter: string; panel: string }> = {
    right: { x: "100%", enter: "right-0 top-0 bottom-0 w-96 max-w-full border-l", panel: "right-0" },
    left: { x: "-100%", enter: "left-0 top-0 bottom-0 w-96 max-w-full border-r", panel: "left-0" },
    bottom: {
      y: "100%",
      enter: "left-0 right-0 bottom-0 w-full max-h-[85vh] border-t rounded-t-xl pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
      panel: "bottom-0",
    },
  };
  const v = variants[side] || variants.right;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={v.y ? { y: v.y } : { x: v.x }}
            animate={{ x: 0, y: 0 }}
            exit={v.y ? { y: v.y } : { x: v.x }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn("absolute bg-panel border-border shadow-lg", v.enter, className)}
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <h3 className="text-sm font-semibold text-foreground">{title || ""}</h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-sidebar-hover hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4" style={{ height: side === "bottom" ? "auto" : "calc(100% - 48px)" }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
