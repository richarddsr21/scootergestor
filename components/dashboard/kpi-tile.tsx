"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { useCountUp } from "./use-count-up"

const FORMATTERS: Record<"integer" | "currency", (n: number) => string> = {
  integer: (n) => String(Math.round(n)),
  currency: (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n),
}

interface KpiTileProps {
  title: string
  numericValue: number
  format?: "integer" | "currency"
  icon: React.ReactNode
  href?: string
  sparkline?: number[]
  size?: "hero" | "default"
  className?: string
}

export function KpiTile({
  title,
  numericValue,
  format = "integer",
  icon,
  href,
  sparkline,
  size = "default",
  className,
}: KpiTileProps) {
  const animated = useCountUp(numericValue)
  const isHero = size === "hero"
  const chartData = (sparkline ?? []).map((value, i) => ({ i, value }))
  const gradientId = `spark-${title.replace(/\W+/g, "-")}`

  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-200",
        !isHero && "min-h-[140px] hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        isHero && "min-h-[220px] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3),0_0_24px_var(--brand-teal-glow)]",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <span
          className={cn("shrink-0 text-brand-teal [&>svg]:size-full", isHero ? "size-6" : "size-5")}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <p className={cn("font-mono font-medium tabular-nums text-foreground", isHero ? "text-4xl" : "text-2xl")}>
        {FORMATTERS[format](animated)}
      </p>

      {chartData.length > 0 && (
        <div className={isHero ? "-mx-2 h-16" : "-mx-1 h-8"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-teal)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brand-teal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--brand-teal)"
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {href && (
        <ArrowUpRight className="absolute bottom-3 right-3 size-3.5 text-brand-teal opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
