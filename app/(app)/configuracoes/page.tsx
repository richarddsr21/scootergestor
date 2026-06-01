import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
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
  ChevronRight,
} from "lucide-react"

const groups = [
  {
    label: "Empresa",
    items: [
      {
        href: "/configuracoes/empresa",
        icon: Building2,
        title: "Dados da empresa",
        description: "Nome, CNPJ, endereço e contato",
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/40",
      },
      {
        href: "/configuracoes/aparencia",
        icon: Palette,
        title: "Aparência",
        description: "Tema, cores e logo da loja",
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-950/40",
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        href: "/configuracoes/categorias",
        icon: Tag,
        title: "Categorias",
        description: "Categorias de produtos e serviços",
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-950/40",
      },
      {
        href: "/configuracoes/status-os",
        icon: ListOrdered,
        title: "Status de OS",
        description: "Fluxo de status das ordens de serviço",
        color: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-950/40",
      },
      {
        href: "/configuracoes/checklist",
        icon: ClipboardList,
        title: "Checklist",
        description: "Itens padrão de inspeção de veículos",
        color: "text-teal-600",
        bg: "bg-teal-50 dark:bg-teal-950/40",
      },
      {
        href: "/configuracoes/servicos",
        icon: Wrench,
        title: "Serviços",
        description: "Catálogo de serviços da oficina",
        color: "text-slate-600",
        bg: "bg-slate-50 dark:bg-slate-800/40",
      },
      {
        href: "/configuracoes/garantias",
        icon: ShieldCheck,
        title: "Garantias",
        description: "Prazos e termos de garantia padrão",
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
      },
    ],
  },
  {
    label: "Financeiro e Comunicação",
    items: [
      {
        href: "/configuracoes/pagamentos",
        icon: CreditCard,
        title: "Pagamentos",
        description: "Formas de pagamento aceitas",
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-950/40",
      },
      {
        href: "/configuracoes/mensagens",
        icon: MessageCircle,
        title: "Mensagens",
        description: "Templates de WhatsApp e notificações",
        color: "text-sky-600",
        bg: "bg-sky-50 dark:bg-sky-950/40",
      },
    ],
  },
  {
    label: "Equipe e Plano",
    items: [
      {
        href: "/configuracoes/usuarios",
        icon: Users,
        title: "Usuários",
        description: "Membros da equipe e permissões",
        color: "text-indigo-600",
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
      },
      {
        href: "/configuracoes/plano",
        icon: Zap,
        title: "Plano",
        description: "Assinatura, limites e faturamento",
        color: "text-yellow-600",
        bg: "bg-yellow-50 dark:bg-yellow-950/40",
      },
    ],
  },
]

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Personalize a plataforma de acordo com a sua operação."
      />

      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
            {group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map(({ href, icon: Icon, title, description, color, bg }) => (
              <Link key={href} href={href}>
                <Card className="group border-border/60 shadow-xs transition-all hover:shadow-sm hover:border-border cursor-pointer h-full">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`size-5 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5 truncate">{description}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/50 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
