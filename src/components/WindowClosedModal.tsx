"use client";

import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarX } from "lucide-react";

interface WindowClosedModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export function WindowClosedModal({ open, message, onClose }: WindowClosedModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <CalendarX className="h-5 w-5 text-amber-600" />
          </div>
          <DialogTitle>Window Closed</DialogTitle>
        </div>
      </DialogHeader>
      <DialogBody>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>OK</Button>
      </DialogFooter>
    </Dialog>
  );
}
