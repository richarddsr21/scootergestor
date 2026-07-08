"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Package, Boxes, ShoppingCart, Wrench, ShieldCheck,
  DollarSign, BarChart3, Settings, ChevronLeft, ChevronRight, Zap, Truck,
  FileText, Landmark, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navGroups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Clientes", href: "/clientes", icon: Users },
      { title: "Produtos", href: "/produtos", icon: Package },
      { title: "Estoque", href: "/estoque", icon: Boxes },
      { title: "Vendas", href: "/vendas", icon: ShoppingCart },
      { title: "Oficina", href: "/oficina", icon: Wrench },
      { title: "Orçamentos", href: "/oficina/orcamentos", icon: FileText },
    ],
  },
  {
    label: "Controle",
    items: [
      { title: "Garantias", href: "/garantias", icon: ShieldCheck },
      { title: "Caixa", href: "/caixa", icon: Landmark },
      { title: "Financeiro", href: "/financeiro", icon: DollarSign },
      { title: "Relatórios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Fornecedores", href: "/fornecedores", icon: Truck },
      { title: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

function useActiveItem() {
  const pathname = usePathname()
  return React.useCallback(
    (href: string) => {
      if (pathname !== href && !pathname.startsWith(href + "/")) return false
      return !allItems.some(
        (other) =>
          other.href !== href &&
          other.href.startsWith(href + "/") &&
          (pathname === other.href || pathname.startsWith(other.href + "/"))
      )
    },
    [pathname]
  )
}

function SidebarNav({
  collapsed,
  lowStockCount,
  onNavigate,
}: {
  collapsed: boolean
  lowStockCount: number
  onNavigate?: () => void
}) {
  const isActiveItem = useActiveItem()

  return (
    <ScrollArea className="flex-1 py-3">
      <nav className="flex flex-col gap-4 px-2">
        {navGroups.map((group, gi) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed && (
              <span className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 select-none">
                {group.label}
              </span>
            )}
            {collapsed && gi > 0 && (
              <div className="my-1 mx-auto h-px w-6 bg-sidebar-border" />
            )}
            {group.items.map((item) => {
              const isActive = isActiveItem(item.href)
              const Icon = item.icon

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "relative flex size-9 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-brand-teal-glow text-brand-teal border-l-2 border-brand-teal"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                        {item.href === "/estoque" && lowStockCount > 0 && (
                          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-brand-coral" />
                        )}
                        <span className="sr-only">{item.title}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                    isActive
                      ? "border-l-2 border-brand-teal bg-brand-teal-glow text-brand-teal font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.href === "/estoque" && lowStockCount > 0 && (
                    <span className="ml-auto size-1.5 rounded-full bg-brand-coral shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
}

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  companyName?: string
  lowStockCount?: number
  mobileOpen: boolean
  onMobileClose: () => void
}

function SidebarLogo({ companyName, onClick }: { companyName?: string; onClick?: () => void }) {
  return (
    <Link href="/dashboard" onClick={onClick} className="flex items-center gap-2 overflow-hidden">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-brand-ink shadow-sm">
        <Zap className="size-4" />
      </div>
      <span className="truncate font-display font-bold text-sm text-sidebar-foreground tracking-wide">
        {companyName ?? "ScooterGestor"}
      </span>
    </Link>
  )
}

export function AppSidebar({
  collapsed,
  onToggle,
  companyName,
  lowStockCount = 0,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <TooltipProvider>
      {/* Desktop — sidebar flutuante, sempre visível a partir de xl (1280px) */}
      <aside
        className={cn(
          "my-4 ml-4 hidden flex-col rounded-2xl border border-sidebar-border bg-sidebar/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md transition-[width] duration-300 ease-in-out xl:flex",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <SidebarLogo companyName={collapsed ? undefined : companyName} />
        </div>

        <SidebarNav collapsed={collapsed} lowStockCount={lowStockCount} />

        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="size-9 w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
          </Button>
        </div>
      </aside>

      {/* Tablet (768–1279px) — drawer acionado pelo hambúrguer do AppHeader */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64 flex-col bg-sidebar shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
              <SidebarLogo companyName={companyName} onClick={onMobileClose} />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-sidebar-foreground"
                onClick={onMobileClose}
              >
                <X className="size-4" />
                <span className="sr-only">Fechar menu</span>
              </Button>
            </div>
            <SidebarNav collapsed={false} lowStockCount={lowStockCount} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </TooltipProvider>
  )
}
