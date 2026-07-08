"use client"

import * as React from "react"
import { useReducedMotion, animate } from "framer-motion"
import { cn } from "@/lib/utils"

const FORMATTERS: Record<"integer" | "currency", (n: number) => string> = {
  integer: (n) => String(Math.round(n)),
  currency: (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n),
}

interface GaugeProps {
  /** Valor atual (ex.: faturamento do mês) */
  value: number
  /** Valor de referência que define as zonas (ex.: faturamento do mês anterior) */
  target: number
  format?: "integer" | "currency"
  label: string
  size?: number
  className?: string
}

const R = 80
const CX = 100
const CY = 100
// Arco semicircular do ponto esquerdo (180°) ao ponto direito (0°), passando por cima.
const ARC_D = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

export function Gauge({ value, target, format = "integer", label, size = 220, className }: GaugeProps) {
  const prefersReducedMotion = useReducedMotion()
  const [animatedPct, setAnimatedPct] = React.useState(0)

  const max = Math.max(value, target * 1.15, 1)
  const pct = Math.min(Math.max(value / max, 0), 1)
  const warningBoundary = Math.min(Math.max((target * 0.7) / max, 0), 1)
  const optimalBoundary = Math.min(Math.max(target / max, 0), 1)

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedPct(pct)
      return
    }
    const controls = animate(0, pct, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setAnimatedPct(v),
    })
    return () => controls.stop()
  }, [pct, prefersReducedMotion])

  const zoneLabel =
    value >= target ? "ótimo" : value >= target * 0.7 ? "atenção" : "crítico"
  const zoneClass =
    value >= target
      ? "text-zone-optimal"
      : value >= target * 0.7
        ? "text-zone-warning"
        : "text-zone-critical"

  const needleDeg = -90 + animatedPct * 180
  const criticalLen = warningBoundary * 100
  const warningLen = (optimalBoundary - warningBoundary) * 100
  const optimalLen = (1 - optimalBoundary) * 100
  const referencePct = Math.round((value / (target || 1)) * 100)

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox="0 0 200 115"
        width={size}
        height={size * 0.575}
        role="img"
        aria-label={`${label}: ${FORMATTERS[format](value)}, ${referencePct}% da referência, zona ${zoneLabel}`}
      >
        <path d={ARC_D} pathLength={100} className="stroke-border" strokeWidth={14} fill="none" strokeLinecap="round" />
        <path
          d={ARC_D}
          pathLength={100}
          strokeDasharray={`${criticalLen} ${100 - criticalLen}`}
          strokeDashoffset={0}
          className="stroke-zone-critical"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={ARC_D}
          pathLength={100}
          strokeDasharray={`${warningLen} ${100 - warningLen}`}
          strokeDashoffset={-criticalLen}
          className="stroke-zone-warning"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={ARC_D}
          pathLength={100}
          strokeDasharray={`${optimalLen} ${100 - optimalLen}`}
          strokeDashoffset={-(criticalLen + warningLen)}
          className="stroke-zone-optimal"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R + 18}
          stroke="var(--foreground)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${needleDeg}deg)`,
          }}
        />
        <circle cx={CX} cy={CY} r={6} className="fill-foreground" />
      </svg>
      <p className={cn("font-mono text-3xl font-bold tabular-nums -mt-2", zoneClass)}>
        {FORMATTERS[format](value)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {label} · {referencePct}% do mês anterior
      </p>
    </div>
  )
}
