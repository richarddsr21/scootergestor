import { Store, TrendingUp, Clock, CheckCircle2, Zap, Quote } from "lucide-react"

const expectedResults = [
  {
    icon: Clock,
    metric: "~1h/dia",
    label: "economizada em operacional",
    desc: "Busca de OS, controle de estoque e respostas ao cliente saem do imprevisto",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/20",
  },
  {
    icon: TrendingUp,
    metric: "1ª semana",
    label: "já operando com controle",
    desc: "Da criação da conta à primeira OS aberta com a equipe treinada e funcionando",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
  },
  {
    icon: CheckCircle2,
    metric: "Todo dia",
    label: "faturamento visível",
    desc: "Dashboard mostra o resultado do dia sem precisar de planilha ou estimativa",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Store,
    metric: "Zero",
    label: "OS perdidas no papel",
    desc: "Tudo digital, buscável por cliente, placa ou número da OS em segundos",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
]

export function PilotCaseSection() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: "oklch(0.085 0.028 255)" }}
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-brand-green/[0.04] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green mb-5">
                  <Zap className="size-3" />
                  Construído com uma loja real, semana a semana
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
                  Desenvolvido em parceria direta com uma loja de scooters no Rio de Janeiro
                </h2>
                <p className="mt-4 text-zinc-400 leading-relaxed">
                  O ScooterGestor não foi construído em uma sala de reuniões por quem nunca viu uma
                  scooter de perto. Foi desenvolvido ao lado de uma loja real — com venda de balcão,
                  peças e oficina ativa no Rio de Janeiro.
                </p>
                <p className="mt-3 text-zinc-400 leading-relaxed">
                  Cada módulo, cada tela e cada fluxo foram validados com o dono e a equipe, semana
                  a semana, durante o desenvolvimento. Os problemas que o sistema resolve são problemas
                  que essa loja enfrentava todos os dias.
                </p>
              </div>

              {/* Testimonial */}
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: "oklch(0.10 0.032 262)",
                  border: "1px solid oklch(0.720 0.185 143 / 0.15)",
                }}
              >
                <Quote className="size-6 text-brand-green/20 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="size-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "oklch(0.645 0.176 216 / 0.15)",
                      border: "1px solid oklch(0.645 0.176 216 / 0.25)",
                    }}
                  >
                    <Store className="size-5 text-brand-blue" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Loja piloto — Rio de Janeiro</div>
                    <div className="text-xs text-zinc-500">Venda de balcão, peças e oficina ativa</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  "Antes eu não sabia quanto havia faturado no mês sem sentar com a planilha no
                  final. Agora abro o dashboard de manhã e já sei exatamente o resultado do dia anterior."
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-green/20 bg-brand-green/10 px-2.5 py-0.5 text-[10px] text-brand-green font-medium">
                  <CheckCircle2 className="size-3" />
                  Usuário piloto verificado
                </div>
              </div>

              {/* Disclaimer */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.10 0.025 255)",
                  border: "1px solid oklch(1 0 0 / 0.06)",
                }}
              >
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Resultados esperados com base no uso durante o desenvolvimento.
                  Os números variam conforme o volume de operação de cada loja.
                </p>
                <p className="mt-1.5 text-xs text-zinc-600 italic">
                  * Acompanhamento real de implantação. Resultados mensuráveis a partir das primeiras semanas.
                </p>
              </div>
            </div>

            {/* Right: metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              {expectedResults.map((r) => {
                const Icon = r.icon
                return (
                  <div
                    key={r.metric}
                    className="rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "oklch(0.10 0.032 262)",
                      borderColor: "oklch(1 0 0 / 0.07)",
                    }}
                  >
                    <div className={`flex size-10 items-center justify-center rounded-xl ${r.bg} border ${r.border}`}>
                      <Icon className={`size-5 ${r.color}`} />
                    </div>
                    <div>
                      <div className={`font-display text-2xl font-bold ${r.color}`}>{r.metric}</div>
                      <div className="text-sm font-semibold text-white mt-0.5">{r.label}</div>
                      <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
