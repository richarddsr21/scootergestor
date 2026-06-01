import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  children?: React.ReactNode
  className?: string
  separator?: boolean
}

export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
  separator = false,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
              {title}
            </h1>
            {badge && (
              <Badge variant="secondary" className="text-xs font-medium">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 items-center gap-2 mt-2 sm:mt-0">
            {children}
          </div>
        )}
      </div>
      {separator && <Separator />}
    </div>
  )
}
