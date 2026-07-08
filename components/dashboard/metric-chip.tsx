import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricChipProps {
  label: string
  value: string
  icon: LucideIcon
  href?: string
  tone?: "default" | "positive" | "negative"
}

const toneClass: Record<NonNullable<MetricChipProps["tone"]>, string> = {
  default: "text-muted-foreground",
  positive: "text-emerald-500",
  negative: "text-brand-coral",
}

export function MetricChip({ label, value, icon: Icon, href, tone = "default" }: MetricChipProps) {
  const content = (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-brand-teal">
      <Icon className={cn("size-4 shrink-0", toneClass[tone])} aria-hidden="true" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
