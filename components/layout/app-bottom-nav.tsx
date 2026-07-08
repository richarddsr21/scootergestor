"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wrench, Users, Boxes, Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const mainItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Oficina", href: "/oficina", icon: Wrench },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Estoque", href: "/estoque", icon: Boxes },
]

const moreItems = [
  { title: "Vendas", href: "/vendas" },
  { title: "Orçamentos", href: "/oficina/orcamentos" },
  { title: "Garantias", href: "/garantias" },
  { title: "Caixa", href: "/caixa" },
  { title: "Financeiro", href: "/financeiro" },
  { title: "Relatórios", href: "/relatorios" },
  { title: "Fornecedores", href: "/fornecedores" },
  { title: "Configurações", href: "/configuracoes" },
]

interface AppBottomNavProps {
  lowStockCount?: number
}

export function AppBottomNav({ lowStockCount = 0 }: AppBottomNavProps) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/90 px-2 py-1.5 backdrop-blur-xl md:hidden"
      aria-label="Navegação principal"
    >
      {mainItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] transition-transform active:scale-[0.92]",
              active ? "text-brand-teal" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <Icon className="size-5" fill={active ? "currentColor" : "none"} />
              {item.href === "/estoque" && lowStockCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brand-coral" />
              )}
            </span>
            {item.title}
            {active && <span className="mt-0.5 size-1 rounded-full bg-brand-teal" />}
          </Link>
        )
      })}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground transition-transform active:scale-[0.92]"
          >
            <Menu className="size-5" />
            Mais
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 p-4 pt-0">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground hover:border-brand-teal"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
