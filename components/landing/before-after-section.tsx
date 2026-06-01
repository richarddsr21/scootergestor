import { X, Check, Zap } from "lucide-react"

const items = [
  {
    before: "OS no papel, difícil de localizar e fácil de perder",
    after: "OS digital — busca por cliente, placa ou número em segundos",
  },
  {
    before: "Estoque invisível: peças somem sem nenhum registro",
    after: "Estoque em tempo real com alerta de mínimo automático",
  },
  {
    before: "Cliente sem resposta, cobrando no WhatsApp sem parar",
    after: "Status atualizado em 5 segundos, mensagem WhatsApp pronta para enviar",
  },
  {
    before: "Financeiro no escuro: não sabe o lucro do mês",
    after: "Faturamento e lucro bruto visíveis no dashboard todo dia",
  },
  {
    before: "Peças usadas na OS sem histórico nem rastreabilidade",
    after: "Peças da OS registradas com baixa automática de estoque",
  },
  {
    before: "Garantias vencendo sem nenhum aviso ou controle",
    after: "Garantia registrada com alerta de vencimento antecipado",
  },
]

export function BeforeAfterSection() {
  return (
    <section className="py-24 bg-brand-navy relative overflow-hidden">
      {/* Divider gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.645 0.176 216 / 0.3) 50%, transparent)" }} />

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{
              border: "1px solid oklch(0.645 0.176 216 / 0.30)",
              background: "oklch(0.645 0.176 216 / 0.08)",
              color: "oklch(0.645 0.176 216)",
            }}
          >
            <Zap className="size-3" />
            Transformação real
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Antes: improviso.{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.720 0.185 143))",
              }}
            >
              Depois: controle.
            </span>
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Situações reais que custam dinheiro toda semana — e como o ScooterGestor resolve cada uma delas.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Column headers */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "oklch(0.60 0.22 25 / 0.10)", border: "1px solid oklch(0.60 0.22 25 / 0.20)" }}
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-red-500/15">
                <X className="size-3.5 text-red-400" />
              </div>
              <span className="text-sm font-bold text-red-400">Sem sistema</span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "oklch(0.720 0.185 143 / 0.10)", border: "1px solid oklch(0.720 0.185 143 / 0.25)" }}
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-brand-green/15">
                <Check className="size-3.5 text-brand-green" />
              </div>
              <span className="text-sm font-bold text-brand-green">Com ScooterGestor</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.095 0.032 262)",
                    border: "1px solid oklch(0.60 0.22 25 / 0.15)",
                  }}
                >
                  <div className="size-5 shrink-0 flex items-center justify-center rounded-full bg-red-500/10">
                    <X className="size-3 text-red-400" />
                  </div>
                  <span className="text-sm text-zinc-400">{item.before}</span>
                </div>

                {/* Center separator */}
                <div className="hidden sm:flex size-7 items-center justify-center shrink-0 rounded-full border border-white/[0.08]"
                  style={{ background: "oklch(0.11 0.030 255)" }}>
                  <div
                    className="size-2 rounded-full"
                    style={{ background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.720 0.185 143))" }}
                  />
                </div>

                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.720 0.185 143 / 0.05)",
                    border: "1px solid oklch(0.720 0.185 143 / 0.18)",
                  }}
                >
                  <div className="size-5 shrink-0 flex items-center justify-center rounded-full bg-brand-green/15">
                    <Check className="size-3 text-brand-green" />
                  </div>
                  <span className="text-sm text-white">{item.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.720 0.185 143 / 0.2) 50%, transparent)" }} />
    </section>
  )
}
