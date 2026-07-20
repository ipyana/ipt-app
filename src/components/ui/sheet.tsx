"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
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

  const isRight = side === "right";
  const slideFrom = isRight ? { x: "100%" } : { x: "-100%" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={slideFrom}
            animate={{ x: 0 }}
            exit={slideFrom}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "absolute top-0 bottom-0 w-96 max-w-full bg-panel border-l border-border shadow-lg",
              isRight ? "right-0" : "left-0",
              className
            )}
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <h3 className="text-sm font-semibold text-foreground">{title || ""}</h3>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-sidebar-hover hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4" style={{ height: "calc(100% - 48px)" }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
