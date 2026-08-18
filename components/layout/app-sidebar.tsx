"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Package, Boxes, ShoppingCart, Wrench, ShieldCheck,
  DollarSign, BarChart3, Settings, ChevronLeft, ChevronRight, Truck,
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
                          "relative flex size-9 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
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
                    "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
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
        <svg viewBox="0 0 100 100" className="size-5" fill="currentColor" aria-hidden="true">
          <path d="M21,27 L33,27 Q35,27 35,29.5 Q35,32 33,32 L21,32 Q19,32 19,29.5 Q19,27 21,27 Z"/>
          <path d="M25.5,37 L31,37 L31,29 Q31,27.5 29.5,27.5 L27,27.5 Q25.5,27.5 25.5,29 Z"/>
          <path d="M24,60 L60,60 Q62,60 62,62 L62,67 Q62,69 60,69 L24,69 Q22,69 22,67 L22,62 Q22,60 24,60 Z"/>
          <path d="M30,35 C23,35 19,40 19,49 L19,64 C19,67 21,69 24,69 L35,69 L35,40 C35,37 33,35 30,35 Z"/>
          <path d="M40,69 L40,50 C40,42 45,36 53,36 L62,36 C74,36 82,44 82,56 C82,62 81,66 80,69 Z"/>
          <circle cx="25" cy="47" r="4" fill="var(--brand-teal)"/>
          <circle cx="31" cy="71" r="8.4" fill="none" stroke="currentColor" strokeWidth="6"/>
          <circle cx="72" cy="71" r="8.4" fill="none" stroke="currentColor" strokeWidth="6"/>
        </svg>
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
          "relative my-4 ml-4 hidden flex-col rounded-2xl border border-sidebar-border bg-sidebar/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md transition-[width] duration-300 ease-in-out xl:flex",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <SidebarLogo companyName={collapsed ? undefined : companyName} />
        </div>

        <SidebarNav collapsed={collapsed} lowStockCount={lowStockCount} />

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-5 z-10 size-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
        </Button>
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
