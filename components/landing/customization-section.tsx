import { SlidersHorizontal, Check } from "lucide-react"

const customizations = [
  {
    title: "Status da OS personalizados",
    desc: "Crie, nomeie, colora e ordene os status que fazem sentido para o fluxo real da sua oficina.",
  },
  {
    title: "Checklist de entrada adaptável",
    desc: "Adicione, remova ou reordene os itens do checklist de recepção de scooters da sua loja.",
  },
  {
    title: "Serviços e preços padrão",
    desc: "Cadastre os serviços da sua oficina com preço, tempo estimado e garantia padrão.",
  },
  {
    title: "Categorias configuráveis",
    desc: "Organize produtos e serviços com categorias que fazem sentido para a sua operação específica.",
  },
  {
    title: "Mensagens de WhatsApp editáveis",
    desc: "Edite os templates de mensagem com variáveis dinâmicas para cada etapa da OS.",
  },
  {
    title: "Formas de pagamento ativas",
    desc: "Ative somente as formas de pagamento que sua loja aceita — Pix, cartão, dinheiro e mais.",
  },
]

const cardBg = "oklch(0.115 0.035 255)"
const sectionBg = "oklch(0.08 0.025 252)"

export function CustomizationSection() {
  return (
    <section className="py-20" style={{ background: sectionBg }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
              style={{
                border: "1px solid oklch(0.645 0.176 216 / 0.25)",
                background: "oklch(0.645 0.176 216 / 0.08)",
                color: "oklch(0.645 0.176 216)",
              }}
            >
              <SlidersHorizontal className="size-3" />
              Personalização por loja
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Adapte o sistema ao jeito da sua loja
            </h2>
            <p className="mt-3 text-lg font-semibold text-brand-blue">
              O sistema se adapta à sua operação, não o contrário.
            </p>
            <p className="mt-2 text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Configure status, checklist, serviços, categorias, garantias, mensagens
              WhatsApp e formas de pagamento conforme a realidade da sua loja.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-start">
            {/* Settings mockup */}
            <div
              className="rounded-xl border border-white/[0.08] p-5 lg:sticky lg:top-24"
              style={{ background: cardBg }}
            >
              <div className="text-xs text-zinc-500 font-medium uppercase mb-4 tracking-wide">Status da OS</div>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Aguardando diagnóstico", color: "bg-zinc-500" },
                  { label: "Em orçamento", color: "bg-brand-blue" },
                  { label: "Aguardando aprovação", color: "bg-amber-500" },
                  { label: "Em manutenção", color: "bg-violet-500" },
                  { label: "Aguardando peça", color: "bg-orange-500" },
                  { label: "Pronto para entrega", color: "bg-brand-green" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div className={`size-3 rounded-full ${s.color} shrink-0`} />
                    <span className="text-xs text-zinc-300">{s.label}</span>
                    <div className="ml-auto flex gap-1">
                      <div className="size-5 rounded bg-white/[0.05] hover:bg-white/[0.10] transition-colors" />
                      <div className="size-5 rounded bg-white/[0.05] hover:bg-white/[0.10] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="h-8 rounded-lg border border-dashed border-white/[0.12] flex items-center justify-center text-xs text-zinc-600 hover:text-zinc-400 hover:border-white/[0.20] transition-colors cursor-pointer">
                  + Adicionar status personalizado
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-3">
              {customizations.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.07] p-4 hover:border-brand-blue/20 transition-colors"
                  style={{ background: cardBg }}
                >
                  <div className="shrink-0 flex size-5 items-center justify-center rounded-full bg-brand-blue/15 border border-brand-blue/25 mt-0.5">
                    <Check className="size-3 text-brand-blue" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
