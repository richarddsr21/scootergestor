import { CalendarCheck, Zap, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react"

const WA_DEMO = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`

const guarantees = [
  "Demonstração gratuita",
  "Sem cartão de crédito",
  "Implantação assistida",
  "Funciona no celular",
  "Sem fidelidade",
]

export function CTASection() {
  return (
    <section className="py-24 bg-brand-navy relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl px-8 py-16 md:py-20 text-center">
          {/* Gradient background */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.11 0.042 262) 0%, oklch(0.085 0.028 255) 50%, oklch(0.11 0.035 255) 100%)",
            }}
          />

          {/* Border gradient */}
          <div
            className="absolute inset-px rounded-[23px] pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.645 0.176 216 / 0.20) 0%, transparent 40%, oklch(0.720 0.185 143 / 0.15) 100%)",
            }}
          />
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              border: "1px solid oklch(0.645 0.176 216 / 0.25)",
            }}
          />

          {/* Glow blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-brand-blue/[0.10] blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] rounded-full bg-brand-green/[0.07] blur-[100px] pointer-events-none" />

          {/* Circuit dots pattern */}
          <div
            className="absolute inset-0 rounded-3xl opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative flex flex-col items-center gap-8 max-w-2xl mx-auto">
            {/* Icon */}
            <div
              className="flex size-16 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, oklch(0.645 0.176 216 / 0.20) 0%, oklch(0.645 0.176 216 / 0.10) 100%)",
                border: "1px solid oklch(0.645 0.176 216 / 0.35)",
                boxShadow: "0 0 32px oklch(0.645 0.176 216 / 0.20)",
              }}
            >
              <Zap className="size-8 text-brand-blue" />
            </div>

            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Cada dia sem sistema é{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.720 0.185 143))",
                  }}
                >
                  mais dinheiro no ralo.
                </span>
              </h2>
              <p className="mt-4 text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Você vê o sistema funcionando ao vivo, com dados reais e os módulos que fazem
                sentido para a sua operação. Gratuito, sem compromisso e sem necessidade de cartão.
              </p>
            </div>

            {/* ROI box */}
            <div
              className="w-full max-w-md rounded-xl p-4 flex items-center gap-3 text-left"
              style={{
                background: "oklch(0.720 0.185 143 / 0.06)",
                border: "1px solid oklch(0.720 0.185 143 / 0.15)",
              }}
            >
              <TrendingUp className="size-5 text-brand-green shrink-0" />
              <p className="text-sm text-zinc-400 leading-snug">
                Lojas que implantam saem do{" "}
                <span className="text-zinc-200 font-medium">improviso para o controle em menos de 7 dias</span>{" "}
                — com a equipe treinada e a operação funcionando.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href={WA_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden animate-glow-pulse inline-flex items-center justify-center gap-2 px-8 rounded-xl text-white font-bold text-base transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))",
                  boxShadow: "0 0 28px oklch(0.645 0.176 216 / 0.40)",
                  height: "52px",
                }}
              >
                <CalendarCheck className="size-5" />
                Agendar demonstração gratuita
                <span
                  className="absolute inset-0 -translate-x-full animate-shimmer"
                  style={{
                    background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.10), transparent)",
                  }}
                />
              </a>
              <a
                href="#planos"
                className="inline-flex items-center justify-center gap-2 px-7 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.10] text-white font-medium text-base transition-all duration-200 hover:-translate-y-0.5"
                style={{ height: "52px" }}
              >
                Ver planos e preços
                <ArrowRight className="size-4" />
              </a>
            </div>

            {/* Guarantees */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {guarantees.map((g) => (
                <div key={g} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <CheckCircle2 className="size-3.5 text-brand-green shrink-0" />
                  {g}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
