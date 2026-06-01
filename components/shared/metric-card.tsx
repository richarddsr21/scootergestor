import * as React from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  trendPositive?: boolean
  colorClass?: string
  bgClass?: string
  href?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive,
  colorClass = "text-primary",
  bgClass = "bg-primary/10",
  href,
  className,
}: MetricCardProps) {
  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px",
        href && "cursor-pointer",
        className
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          bgClass
        )}
      />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              {title}
            </p>
            <p className="font-display font-bold text-2xl text-foreground leading-none tabular-nums">
              {value}
            </p>
            {trend && (
              <div
                className={cn(
                  "mt-2.5 inline-flex items-center gap-1 text-xs font-medium rounded-md px-1.5 py-0.5",
                  trendPositive === true && "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40",
                  trendPositive === false && "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
                  trendPositive === undefined && "text-muted-foreground bg-muted"
                )}
              >
                {trendPositive === true && <TrendingUp className="size-3" />}
                {trendPositive === false && <TrendingDown className="size-3" />}
                {trend}
              </div>
            )}
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", bgClass)}>
            <Icon className={cn("size-5", colorClass)} />
          </div>
        </div>

        {/* Arrow indicator on hover when clickable */}
        {href && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowUpRight className={cn("size-3.5", colorClass)} />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
