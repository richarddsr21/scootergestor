import { Zap, Wrench, Receipt, BarChart3, CalendarCheck, Boxes } from "lucide-react"

const WA_LINK = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`

const pillars = [
  {
    icon: Wrench,
    title: "Oficina digital",
    desc: "Do recebimento à entrega: checklist, diagnóstico, orçamento, peças e mão de obra em um fluxo digital. Status em tempo real, garantia registrada automaticamente.",
    items: [
      "Checklist de entrada personalizado",
      "Diagnóstico e orçamento digital",
      "Peças e mão de obra na OS",
      "Status personalizados da oficina",
    ],
    accentColor: "oklch(0.645 0.176 216)",
    borderStyle: "border-brand-blue/20",
    bgStyle: "bg-brand-blue/10",
    textStyle: "text-brand-blue",
    dotColor: "bg-brand-blue",
  },
  {
    icon: Boxes,
    title: "Estoque inteligente",
    desc: "Inventário em tempo real com alerta de mínimo. Baixa automática por venda e por OS. Nunca mais perde peça por descontrole ou vende o que não tem.",
    items: [
      "Baixa automática por venda",
      "Baixa automática por OS",
      "Alerta de estoque mínimo",
      "Histórico de movimentações",
    ],
    accentColor: "oklch(0.720 0.185 143)",
    borderStyle: "border-brand-green/20",
    bgStyle: "bg-brand-green/10",
    textStyle: "text-brand-green",
    dotColor: "bg-brand-green",
  },
  {
    icon: Receipt,
    title: "Vendas e PDV",
    desc: "PDV completo com carrinho, desconto, múltiplos pagamentos e baixa automática de estoque. Cada venda registrada com dois toques — sem digitação manual.",
    items: [
      "PDV com carrinho e desconto",
      "Pagamento misto (Pix + cartão + dinheiro)",
      "Baixa automática de estoque",
      "Histórico de compras por cliente",
    ],
    accentColor: "oklch(0.82 0.18 80)",
    borderStyle: "border-amber-500/20",
    bgStyle: "bg-amber-500/10",
    textStyle: "text-amber-400",
    dotColor: "bg-amber-400",
  },
  {
    icon: BarChart3,
    title: "Financeiro claro",
    desc: "Faturamento do dia, lucro bruto e despesas no dashboard. Não espere o fim do mês para saber se a loja está lucrando — você vê isso todo dia de manhã.",
    items: [
      "Dashboard com faturamento do dia",
      "Lucro bruto estimado em tempo real",
      "Relatórios de vendas e OS",
      "Margem de lucro por produto",
    ],
    accentColor: "oklch(0.55 0.20 285)",
    borderStyle: "border-violet-500/20",
    bgStyle: "bg-violet-500/10",
    textStyle: "text-violet-400",
    dotColor: "bg-violet-400",
  },
]

export function SolutionSection() {
  return (
    <section id="solucao" className="py-24 scroll-mt-16 relative overflow-hidden" style={{ background: "oklch(0.085 0.028 255)" }}>
      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(to right, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/35 bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue mb-4">
            <Zap className="size-3" />
            A solução completa
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Quatro pilares que eliminam o improviso da sua operação
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
            Cada módulo foi pensado para o fluxo real de uma loja de scooters elétricas.
            Simples para qualquer funcionário usar. Completo para o dono ter controle total.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="group relative rounded-2xl p-px overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${p.accentColor}30 0%, transparent 60%)`,
                }}
              >
                <div
                  className="rounded-2xl p-6 flex flex-col gap-5 h-full"
                  style={{ background: "oklch(0.10 0.032 262)" }}
                >
                  <div className={`flex size-12 items-center justify-center rounded-xl ${p.bgStyle} border ${p.borderStyle}`}>
                    <Icon className={`size-6 ${p.textStyle}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-2 ${p.textStyle}`}>{p.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                  <ul className="flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                        <div className={`size-1.5 rounded-full ${p.dotColor} shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mid CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-brand-blue/30"
            style={{ background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))" }}
          >
            <CalendarCheck className="size-4" />
            Ver o sistema funcionando ao vivo
          </a>
          <a href="#como-funciona" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Como é a implantação? →
          </a>
        </div>
      </div>
    </section>
  )
}
