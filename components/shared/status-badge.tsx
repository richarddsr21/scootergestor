import * as React from "react"
import { cn } from "@/lib/utils"

type StatusVariant = "success" | "warning" | "error" | "info" | "neutral"

interface StatusBadgeProps {
  label: string
  /** Hex color from the database (takes priority over variant) */
  color?: string
  variant?: StatusVariant
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  warning: "bg-amber-50 text-amber-700 ring-amber-200/60",
  error:   "bg-red-50 text-red-700 ring-red-200/60",
  info:    "bg-sky-50 text-sky-700 ring-sky-200/60",
  neutral: "bg-muted text-muted-foreground ring-border",
}

export function StatusBadge({
  label,
  color,
  variant = "neutral",
  className,
}: StatusBadgeProps) {
  if (color) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          className
        )}
        style={{
          backgroundColor: `${color}18`,
          color: color,
          outline: `1px solid ${color}40`,
        }}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
