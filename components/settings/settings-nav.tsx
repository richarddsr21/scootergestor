"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2,
  Palette,
  Tag,
  ListOrdered,
  ClipboardList,
  Wrench,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Users,
  Zap,
} from "lucide-react"

const navItems = [
  { href: "/configuracoes/empresa", label: "Dados da empresa", icon: Building2 },
  { href: "/configuracoes/aparencia", label: "Aparência", icon: Palette },
  { href: "/configuracoes/categorias", label: "Categorias", icon: Tag },
  { href: "/configuracoes/status-os", label: "Status de OS", icon: ListOrdered },
  { href: "/configuracoes/checklist", label: "Checklist", icon: ClipboardList },
  { href: "/configuracoes/servicos", label: "Serviços", icon: Wrench },
  { href: "/configuracoes/garantias", label: "Garantias", icon: ShieldCheck },
  { href: "/configuracoes/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/configuracoes/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/configuracoes/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes/plano", label: "Plano", icon: Zap },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
