"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface MobileNavProps {
  role: string;
  userRole?: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function MobileNav({ role, userRole, open, onClose, onLogout }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-[60] w-64 bg-sidebar shadow-xl lg:hidden"
          >
            <div className="relative h-full">
              <button
                onClick={onClose}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-sidebar-hover"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar role={role} userRole={userRole} onLogout={onLogout} isMobile onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
