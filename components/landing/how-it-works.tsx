import { Rocket, Users, LayoutDashboard, CheckCircle } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Rocket,
    title: "Implantação guiada",
    description:
      "Nossa equipe configura o sistema junto com você: status de OS, checklist de entrada, serviços, formas de pagamento e cadastro inicial de produtos. Sem estresse, sem surpresa, sem você ter que descobrir sozinho.",
    detail: "Tempo médio: 2–3 dias úteis",
    accentColor: "oklch(0.645 0.176 216)",
    iconClass: "text-brand-blue",
    bgClass: "bg-brand-blue/10",
    borderClass: "border-brand-blue/25",
    numberClass: "text-brand-blue",
  },
  {
    number: "02",
    icon: Users,
    title: "Equipe operando em 1 dia",
    description:
      "Interface direta, sem treinamento longo e sem manual de 80 páginas. Técnico abre OS, vendedor registra venda, dono acompanha o dashboard. Em 1 dia sua equipe já opera com confiança.",
    detail: "Treinamento inicial incluso",
    accentColor: "oklch(0.720 0.185 143)",
    iconClass: "text-brand-green",
    bgClass: "bg-brand-green/10",
    borderClass: "border-brand-green/25",
    numberClass: "text-brand-green",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Controle total da operação",
    description:
      "Estoque em tempo real, OS sem papel, garantias registradas, financeiro visível todo dia. A partir daqui, você toma decisões com dados reais — não mais no escuro.",
    detail: "Controle completo da operação",
    accentColor: "oklch(0.82 0.18 80)",
    iconClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    numberClass: "text-amber-400",
  },
]

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-brand-navy scroll-mt-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-brand-green/[0.04] blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{
              border: "1px solid oklch(0.720 0.185 143 / 0.30)",
              background: "oklch(0.720 0.185 143 / 0.08)",
              color: "oklch(0.720 0.185 143)",
            }}
          >
            Em menos de uma semana
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Do zero ao controle total em 3 passos
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
            Comece a operar em dias. Sem instalação. Sem treinamento longo. 100% no navegador — funciona no celular, tablet ou computador.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="flex gap-6 group">
                {/* Left: icon + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`relative flex size-14 items-center justify-center rounded-2xl ${step.bgClass} border ${step.borderClass} shadow-lg transition-all duration-300`}
                    style={{ boxShadow: `0 4px 20px ${step.accentColor}20` }}
                  >
                    <Icon className={`size-6 ${step.iconClass}`} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className="w-0.5 flex-1 my-3 rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${step.accentColor}40, ${steps[idx + 1].accentColor}20)`,
                        minHeight: "40px",
                      }}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div className={`flex flex-col gap-2 ${idx === steps.length - 1 ? "pb-0" : "pb-10"}`}>
                  <div className="flex items-baseline gap-3">
                    <span className={`font-display text-5xl font-extrabold ${step.numberClass} opacity-15 leading-none select-none`}>
                      {step.number}
                    </span>
                    <h3 className={`font-display text-xl font-bold ${step.numberClass}`}>{step.title}</h3>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">{step.description}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle className={`size-3.5 ${step.iconClass}`} />
                    <span className="text-xs text-zinc-500">{step.detail}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
