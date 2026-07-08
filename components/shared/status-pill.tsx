import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

type Zone = "optimal" | "warning" | "critical"

interface StatusPillProps {
  zone: Zone
  label: string
  icon?: React.ReactNode
  className?: string
}

const ZONE_VARIANT: Record<Zone, "zoneOptimal" | "zoneWarning" | "zoneCritical"> = {
  optimal: "zoneOptimal",
  warning: "zoneWarning",
  critical: "zoneCritical",
}

const ZONE_DEFAULT_ICON: Record<Zone, LucideIcon> = {
  optimal: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
}

export function StatusPill({ zone, label, icon, className }: StatusPillProps) {
  const DefaultIcon = ZONE_DEFAULT_ICON[zone]
  return (
    <Badge variant={ZONE_VARIANT[zone]} className={className}>
      {icon ?? <DefaultIcon aria-hidden="true" />}
      {label}
    </Badge>
  )
}
