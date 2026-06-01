import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface SectionHeadingProps {
  title: string
  description?: string
  badge?: string
  action?: React.ReactNode
  className?: string
  divider?: boolean
}

export function SectionHeading({
  title,
  description,
  badge,
  action,
  className,
  divider = false,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-base text-foreground leading-tight">
              {title}
            </h2>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {divider && <Separator />}
    </div>
  )
}
