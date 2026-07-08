"use client"

import { cn } from "@/lib/utils"

interface ZoneBarProps {
  value: number
  max: number
  warningAt?: number
  criticalAt?: number
  label: string
  className?: string
}

export function ZoneBar({
  value,
  max,
  warningAt = 0.05,
  criticalAt = 0.2,
  label,
  className,
}: ZoneBarProps) {
  // Sentido inverso do Gauge: aqui um ratio MAIOR é pior (ex.: fração do
  // catálogo com estoque baixo) — no Gauge, um value MAIOR é melhor (faturamento).
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const zone = ratio >= criticalAt ? "critical" : ratio >= warningAt ? "warning" : "optimal"
  const zoneBarClass = {
    optimal: "bg-zone-optimal",
    warning: "bg-zone-warning",
    critical: "bg-zone-critical",
  }[zone]
  const zoneTextClass = {
    optimal: "text-zone-optimal-text",
    warning: "text-zone-warning-text",
    critical: "text-zone-critical-text",
  }[zone]

  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", zoneBarClass)}
          style={{ width: `${Math.max(ratio * 100, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <p className={cn("mt-1 text-[11px] font-medium", zoneTextClass)}>{label}</p>
    </div>
  )
}
