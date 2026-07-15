"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  current: number;
  className?: string;
}

export function Steps({ steps, current, className }: StepsProps) {
  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                i < current
                  ? "bg-emerald-500 text-white"
                  : i === current
                  ? "bg-primary-600 text-white ring-4 ring-primary-100"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-xs font-medium",
                  i <= current ? "text-slate-900" : "text-slate-400"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-[10px] text-slate-400 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-2">
              <div
                className={cn(
                  "h-0.5 rounded-full transition-all duration-500",
                  i < current ? "bg-emerald-500" : "bg-slate-200"
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
