"use client";

import { Dialog } from "@/components/ui/dialog";
import { GraduationCap, Users } from "lucide-react";

interface RoleModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (role: "student" | "staff") => void;
}

export function RoleModal({ open, onClose, onSelect }: RoleModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Create Your Account</h2>
        <p className="text-sm text-slate-500 mt-0.5">Are you a student or staff?</p>
      </div>
      <div className="px-5 py-5 space-y-3">
        <button
          onClick={() => onSelect("student")}
          className="w-full flex items-center gap-4 rounded-lg border-2 border-slate-200 p-4 text-left hover:border-primary-300 transition-all dark:border-slate-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <GraduationCap className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Student</p>
            <p className="text-xs text-slate-400 mt-0.5">I'm a registered student</p>
          </div>
        </button>
        <button
          onClick={() => onSelect("staff")}
          className="w-full flex items-center gap-4 rounded-lg border-2 border-slate-200 p-4 text-left hover:border-emerald-300 transition-all dark:border-slate-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Staff / Facilitator</p>
            <p className="text-xs text-slate-400 mt-0.5">I'm a cluster facilitator</p>
          </div>
        </button>
      </div>
    </Dialog>
  );
}
