"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "default" | "lg";
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  size = "default",
  variant = "primary",
  className,
  showLabel = false,
}: ProgressProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  const sizes = { sm: "h-1.5", default: "h-2", lg: "h-3" };
  const variants = {
    primary: "bg-primary-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  const variantColors = {
    primary: "text-primary-700",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full rounded-full bg-slate-100 overflow-hidden", sizes[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", sizes[size], variants[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className={cn("text-xs mt-1", variantColors[variant])}>
          {pct}%
        </p>
      )}
    </div>
  );
}
