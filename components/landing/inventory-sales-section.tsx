import { Package, ShoppingCart, AlertTriangle, TrendingUp, History, BarChart2, Percent } from "lucide-react"

const inventoryCards = [
  {
    icon: TrendingUp,
    title: "Baixa automática por venda",
    desc: "Cada venda no PDV desconta automaticamente o produto do estoque. Zero digitação manual, zero erro.",
    iconClass: "text-brand-blue",
    bgClass: "bg-brand-blue/10",
    borderClass: "border-brand-blue/20",
  },
  {
    icon: Package,
    title: "Baixa automática por OS",
    desc: "Peças usadas em ordens de serviço também baixam o estoque. Rastreabilidade completa do uso.",
    iconClass: "text-brand-green",
    bgClass: "bg-brand-green/10",
    borderClass: "border-brand-green/20",
  },
  {
    icon: AlertTriangle,
    title: "Alerta de estoque baixo",
    desc: "Defina o mínimo por produto. O dashboard alerta antes que você fique sem estoque na hora errada.",
    iconClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
  },
  {
    icon: History,
    title: "Histórico de movimentações",
    desc: "Veja cada entrada e saída de cada produto, com data, quantidade e origem da movimentação.",
    iconClass: "text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/20",
  },
  {
    icon: BarChart2,
    title: "Produtos mais vendidos",
    desc: "Relatório dos produtos com maior saída. Saiba o que repor primeiro e o que está parado no estoque.",
    iconClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/20",
  },
  {
    icon: Percent,
    title: "Margem por produto",
    desc: "Cadastre custo e preço de venda. O sistema calcula a margem e o lucro bruto por produto automaticamente.",
    iconClass: "text-brand-green",
    bgClass: "bg-brand-green/10",
    borderClass: "border-brand-green/20",
  },
]

const cardBg = "oklch(0.115 0.035 255)"
const cardBgDark = "oklch(0.095 0.030 256)"
const sectionBg = "oklch(0.09 0.028 252)"

export function InventorySalesSection() {
  return (
    <section className="py-20 bg-brand-navy">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{
              border: "1px solid oklch(0.720 0.185 143 / 0.30)",
              background: "oklch(0.720 0.185 143 / 0.08)",
              color: "oklch(0.720 0.185 143)",
            }}
          >
            Estoque e Vendas
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Venda no balcão e mantenha o estoque certo
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
            Cada venda e cada OS atualizam o estoque automaticamente. Nunca mais perde peça,
            nunca mais vende o que não tem, nunca mais descobre o problema no fim do mês.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-12">
          {inventoryCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`rounded-xl border ${card.borderClass} p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5`}
                style={{ background: cardBg }}
              >
                <div className={`flex size-10 items-center justify-center rounded-lg ${card.bgClass} border ${card.borderClass}`}>
                  <Icon className={`size-5 ${card.iconClass}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white mb-1">{card.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Estoque mockup */}
          <div className="rounded-2xl border border-white/[0.08] p-6 flex flex-col gap-5" style={{ background: cardBg }}>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-green/10 border border-brand-green/20">
                <Package className="size-5 text-brand-green" />
              </div>
              <div>
                <h3 className="font-bold text-white">Controle de Estoque</h3>
                <p className="text-xs text-zinc-400">Visão completa do seu inventário em tempo real</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: cardBgDark }}>
              <div className="grid grid-cols-3 px-3 py-2 border-b border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-medium uppercase">Produto</span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase text-center">Qtd</span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase text-right">Status</span>
              </div>
              {[
                { name: "Bateria 48v 20Ah", qty: 8, status: "ok" },
                { name: "Controle BLDC 48v", qty: 2, status: "low" },
                { name: "Pneu traseiro 10in", qty: 0, status: "zero" },
                { name: "Carregador 54.6v", qty: 12, status: "ok" },
                { name: "Display LCD KD21", qty: 1, status: "low" },
              ].map((item) => (
                <div key={item.name} className="grid grid-cols-3 px-3 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <span className="text-xs text-zinc-300 truncate">{item.name}</span>
                  <span className="text-xs text-center font-medium text-white">{item.qty}</span>
                  <div className="flex justify-end">
                    {item.status === "ok" && (
                      <span className="text-[10px] bg-brand-green/15 text-brand-green rounded px-1.5 py-0.5">Normal</span>
                    )}
                    {item.status === "low" && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <AlertTriangle className="size-2.5" />Baixo
                      </span>
                    )}
                    {item.status === "zero" && (
                      <span className="text-[10px] bg-red-500/15 text-red-400 rounded px-1.5 py-0.5">Zerado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Produtos", value: "247", color: "text-white" },
                { label: "Alertas", value: "3", color: "text-amber-400" },
                { label: "Zerados", value: "1", color: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/[0.06] p-3 text-center" style={{ background: cardBgDark }}>
                  <div className={`font-display text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PDV mockup */}
          <div className="rounded-2xl border border-white/[0.08] p-6 flex flex-col gap-5" style={{ background: cardBg }}>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/10 border border-brand-blue/20">
                <ShoppingCart className="size-5 text-brand-blue" />
              </div>
              <div>
                <h3 className="font-bold text-white">PDV — Ponto de Venda</h3>
                <p className="text-xs text-zinc-400">Venda rápida com múltiplos pagamentos</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] p-4 flex flex-col gap-3" style={{ background: cardBgDark }}>
              <div className="text-xs text-zinc-500 font-medium uppercase">Carrinho</div>
              {[
                { name: "Patinete Xiaomi Essential", qty: 1, price: "R$ 1.890,00" },
                { name: "Capacete EVO Urban M", qty: 1, price: "R$ 189,00" },
                { name: "Trava de guidão", qty: 2, price: "R$ 79,90" },
              ].map((item) => (
                <div key={item.name} className="flex items-start justify-between gap-3 py-1.5 border-b border-white/[0.05] last:border-0">
                  <div>
                    <div className="text-xs text-white">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Qty: {item.qty}</div>
                  </div>
                  <div className="text-xs font-medium text-white shrink-0">{item.price}</div>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <span className="text-xs text-zinc-400">Subtotal</span>
                <span className="text-sm font-bold text-white">R$ 2.238,80</span>
              </div>
              <div className="rounded-lg bg-brand-blue/10 border border-brand-blue/20 p-2.5 flex items-center justify-between">
                <span className="text-xs text-brand-blue font-medium">Desconto 5%</span>
                <span className="text-xs text-brand-blue">- R$ 111,94</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-300">Total</span>
                <span className="font-display text-base font-bold text-brand-green">R$ 2.126,86</span>
              </div>
              <div className="flex gap-2">
                {["Dinheiro", "Pix", "Cartão"].map((p) => (
                  <div key={p} className={`flex-1 text-center rounded-lg py-1.5 text-[11px] font-medium ${p === "Pix" ? "bg-brand-green text-white" : "bg-white/[0.06] text-zinc-400"}`}>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <TrendingUp className="size-4 text-brand-green" />
              Estoque baixa automaticamente ao confirmar a venda
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
