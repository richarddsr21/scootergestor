import {
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Wrench,
  ClipboardCheck,
  ShieldCheck,
  DollarSign,
  BarChart3,
  MessageCircle,
  ClipboardList,
  UserCog,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Clientes",
    description: "Cadastro completo com histórico de compras, OS, garantias e todas as scooters atendidas.",
    iconClass: "text-brand-blue",
    bgClass: "bg-brand-blue/10",
    borderClass: "border-brand-blue/20",
    hoverBorderClass: "hover:border-brand-blue/40",
    topBarStyle: "from-brand-blue/0 via-brand-blue/40 to-brand-blue/0",
  },
  {
    icon: Package,
    title: "Produtos",
    description: "Scooters, peças, acessórios e capacetes com custo, preço de venda, margem e estoque mínimo.",
    iconClass: "text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/20",
    hoverBorderClass: "hover:border-violet-500/40",
    topBarStyle: "from-violet-500/0 via-violet-500/40 to-violet-500/0",
  },
  {
    icon: Boxes,
    title: "Estoque",
    description: "Controle de inventário em tempo real com alerta de mínimo, histórico de entradas e saídas.",
    iconClass: "text-brand-green",
    bgClass: "bg-brand-green/10",
    borderClass: "border-brand-green/20",
    hoverBorderClass: "hover:border-brand-green/40",
    topBarStyle: "from-brand-green/0 via-brand-green/40 to-brand-green/0",
  },
  {
    icon: ShoppingCart,
    title: "Vendas e PDV",
    description: "Ponto de venda com carrinho, desconto, múltiplos pagamentos e baixa automática de estoque.",
    iconClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    hoverBorderClass: "hover:border-amber-500/40",
    topBarStyle: "from-amber-500/0 via-amber-500/40 to-amber-500/0",
  },
  {
    icon: Wrench,
    title: "Oficina",
    description: "Abertura de OS, diagnóstico, peças usadas, mão de obra, orçamento e Kanban da oficina.",
    iconClass: "text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
    hoverBorderClass: "hover:border-orange-500/40",
    topBarStyle: "from-orange-500/0 via-orange-500/40 to-orange-500/0",
  },
  {
    icon: ClipboardCheck,
    title: "OS completa",
    description: "Ordem de serviço digital do checklist de entrada à entrega, com registro total do histórico.",
    iconClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/20",
    hoverBorderClass: "hover:border-sky-500/40",
    topBarStyle: "from-sky-500/0 via-sky-500/40 to-sky-500/0",
  },
  {
    icon: ClipboardList,
    title: "Checklist",
    description: "Checklist digital personalizável na recepção de cada scooter. Tudo documentado e assinado.",
    iconClass: "text-teal-400",
    bgClass: "bg-teal-500/10",
    borderClass: "border-teal-500/20",
    hoverBorderClass: "hover:border-teal-500/40",
    topBarStyle: "from-teal-500/0 via-teal-500/40 to-teal-500/0",
  },
  {
    icon: ShieldCheck,
    title: "Garantias",
    description: "Controle de garantia por scooter, bateria, carregador, peça e serviço com alerta de vencimento.",
    iconClass: "text-brand-green",
    bgClass: "bg-brand-green/10",
    borderClass: "border-brand-green/20",
    hoverBorderClass: "hover:border-brand-green/40",
    topBarStyle: "from-brand-green/0 via-brand-green/40 to-brand-green/0",
  },
  {
    icon: DollarSign,
    title: "Financeiro",
    description: "Entradas, saídas, despesas e lucro bruto estimado. Visão clara do caixa da loja todo dia.",
    iconClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    hoverBorderClass: "hover:border-amber-500/40",
    topBarStyle: "from-amber-500/0 via-amber-500/40 to-amber-500/0",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Faturamento, estoque, OS, serviços mais realizados e desempenho da equipe em um clique.",
    iconClass: "text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/20",
    hoverBorderClass: "hover:border-rose-500/40",
    topBarStyle: "from-rose-500/0 via-rose-500/40 to-rose-500/0",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Templates prontos para OS aberta, orçamento, conclusão e entrega. Copia e envia com um clique.",
    iconClass: "text-brand-green",
    bgClass: "bg-brand-green/10",
    borderClass: "border-brand-green/20",
    hoverBorderClass: "hover:border-brand-green/40",
    topBarStyle: "from-brand-green/0 via-brand-green/40 to-brand-green/0",
  },
  {
    icon: UserCog,
    title: "Usuários e Permissões",
    description: "Cada funcionário tem login próprio e permissões por cargo — técnico, vendedor, gestor.",
    iconClass: "text-brand-blue",
    bgClass: "bg-brand-blue/10",
    borderClass: "border-brand-blue/20",
    hoverBorderClass: "hover:border-brand-blue/40",
    topBarStyle: "from-brand-blue/0 via-brand-blue/40 to-brand-blue/0",
  },
]

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-24 bg-brand-navy scroll-mt-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-brand-blue/[0.04] blur-[160px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{
              border: "1px solid oklch(0.645 0.176 216 / 0.30)",
              background: "linear-gradient(135deg, oklch(0.645 0.176 216 / 0.10), oklch(0.720 0.185 143 / 0.06))",
              color: "oklch(0.645 0.176 216)",
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.720 0.185 143))" }}
            />
            12 módulos integrados · Tudo que sua loja precisa
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Uma plataforma. Todos os módulos.
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
            Cada módulo foi desenvolvido para o fluxo real de uma loja de scooters — não adaptado de outro segmento. Do atendimento ao financeiro, tudo em um único sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-6xl mx-auto">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={`${feature.title}-${i}`}
                className={`group relative rounded-xl border ${feature.borderClass} ${feature.hoverBorderClass} p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                style={{ background: "oklch(0.10 0.030 262)" }}
              >
                {/* Top accent line — visible on hover via group */}
                <div
                  className={`absolute top-0 left-4 right-4 h-px rounded-full bg-gradient-to-r ${feature.topBarStyle} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className={`flex size-10 items-center justify-center rounded-lg ${feature.bgClass} border ${feature.borderClass}`}>
                  <Icon className={`size-5 ${feature.iconClass}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white mb-1">{feature.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
