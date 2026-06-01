/**
 * EmptyState — generic empty/error state component
 *
 * @example
 * // Clientes
 * <EmptyState icon={Users} title="Nenhum cliente cadastrado ainda."
 *   description="Cadastre o primeiro para registrar vendas e OS." />
 *
 * @example
 * // Produtos
 * <EmptyState icon={Package} title="Nenhum produto cadastrado."
 *   description="Adicione scooters, peças e acessórios." />
 *
 * @example
 * // OS
 * <EmptyState icon={Wrench} title="Nenhuma OS aberta."
 *   description="Crie uma para acompanhar diagnóstico e manutenção." />
 */

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Pass CTA buttons or links as children */
  children?: React.ReactNode
  className?: string
  variant?: "default" | "error"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center px-6",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mb-5 flex size-16 items-center justify-center rounded-2xl",
            variant === "error"
              ? "bg-destructive/10"
              : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "size-8",
              variant === "error"
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
