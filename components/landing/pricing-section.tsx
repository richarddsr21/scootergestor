import { Check, Star, Zap, MessageCircle, CalendarCheck, Building2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const WA_DEMO = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`
const WA_ENTERPRISE = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Quero saber mais sobre o plano Enterprise do ScooterGestor.")}`

const plans = [
  {
    id: "start",
    name: "Start",
    price: 197,
    dailyPrice: "R$6,56",
    setup: 497,
    description: "Para lojas que querem sair do papel e da planilha de vez.",
    highlight: false,
    badge: null,
    limits: ["1 unidade", "2 usuários", "300 produtos", "300 clientes", "100 OS/mês"],
    features: [
      "Dashboard com faturamento do dia",
      "Cadastro de clientes e histórico",
      "Cadastro de produtos com margem",
      "Controle de estoque com alertas",
      "Vendas e PDV simples",
      "Ordem de serviço básica",
      "Status de OS padrão",
      "Controle de garantia",
      "Relatórios básicos",
      "Suporte por WhatsApp",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 297,
    dailyPrice: "R$9,90",
    setup: 797,
    description: "Para lojas com venda de balcão ativa e oficina funcionando.",
    highlight: true,
    badge: "Mais recomendado",
    limits: ["1 unidade", "5 usuários", "1.500 produtos", "2.000 clientes", "500 OS/mês"],
    features: [
      "Tudo do Start, mais:",
      "PDV completo com desconto",
      "Pagamento misto",
      "Baixa automática de estoque",
      "OS completa com peças e serviços",
      "Checklist de entrada personalizado",
      "Status de OS personalizados",
      "Diagnóstico e orçamento de OS",
      "Controle de garantia completo",
      "Histórico completo da scooter",
      "Templates WhatsApp editáveis",
      "Financeiro básico",
      "Relatórios de vendas, estoque e OS",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 497,
    dailyPrice: "R$16,56",
    setup: 1497,
    description: "Para lojas com equipe maior e controle total da operação.",
    highlight: false,
    badge: null,
    limits: ["2 unidades", "10 usuários", "5.000 produtos", "10.000 clientes", "1.500 OS/mês"],
    features: [
      "Tudo do Pro, mais:",
      "Permissões por cargo",
      "Fotos na OS",
      "PDF de OS, orçamento e recibo",
      "Fornecedores e compras",
      "Histórico avançado da scooter",
      "Relatórios avançados",
      "Lucro bruto por produto e OS",
      "Relatório de serviços mais rentáveis",
      "Suporte prioritário",
      "Treinamento inicial completo",
    ],
  },
]

export function PricingSection() {
  return (
    <section id="planos" className="py-24 scroll-mt-16 relative overflow-hidden" style={{ background: "oklch(0.07 0.028 255)" }}>
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand-blue/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-brand-green/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{
              border: "1px solid oklch(0.720 0.185 143 / 0.30)",
              background: "oklch(0.720 0.185 143 / 0.08)",
              color: "oklch(0.720 0.185 143)",
            }}
          >
            <TrendingUp className="size-3" />
            Planos e preços
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Menos que um cafezinho por dia.{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.720 0.185 143))",
              }}
            >
              Retorno no primeiro mês.
            </span>
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Todos os planos incluem demonstração gratuita, implantação assistida e suporte direto.
            Você começa acompanhado — não sozinho.
          </p>

          {/* ROI highlight */}
          <div
            className="mt-6 mx-auto max-w-xl rounded-xl p-4 flex items-center gap-3 text-left"
            style={{
              background: "oklch(0.720 0.185 143 / 0.06)",
              border: "1px solid oklch(0.720 0.185 143 / 0.15)",
            }}
          >
            <div className="size-8 rounded-lg bg-brand-green/15 border border-brand-green/25 flex items-center justify-center shrink-0">
              <Zap className="size-4 text-brand-green" />
            </div>
            <p className="text-sm text-zinc-300 leading-snug">
              Uma loja sem sistema perde em média{" "}
              <span className="text-white font-semibold">R$600–1.200/mês</span> em estoque não
              registrado, vendas perdidas e retrabalho. O plano Start custa <span className="text-brand-green font-semibold">R$197/mês</span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border transition-all duration-300",
                plan.highlight
                  ? "border-brand-blue/50 shadow-2xl shadow-brand-blue/15"
                  : "border-white/[0.08] hover:border-white/[0.14]"
              )}
              style={
                plan.highlight
                  ? {
                      background: "linear-gradient(180deg, oklch(0.115 0.040 260) 0%, oklch(0.10 0.032 262) 100%)",
                    }
                  : { background: "oklch(0.10 0.032 262)" }
              }
            >
              {/* Blue glow ring for Pro */}
              {plan.highlight && (
                <div
                  className="absolute inset-px rounded-[15px] pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.645 0.176 216 / 0.12) 0%, transparent 60%)",
                  }}
                />
              )}

              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))",
                      boxShadow: "0 4px 16px oklch(0.645 0.176 216 / 0.40)",
                    }}
                  >
                    <Star className="size-3 fill-white" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="relative p-6 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className={cn(
                    "font-display text-xl font-bold",
                    plan.highlight ? "text-brand-blue" : "text-white"
                  )}>{plan.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-white">R$ {plan.price}</span>
                    <span className="text-sm text-zinc-500">/mês</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className="text-xs font-semibold rounded-md px-2 py-0.5"
                      style={{
                        background: "oklch(0.720 0.185 143 / 0.10)",
                        color: "oklch(0.720 0.185 143)",
                        border: "1px solid oklch(0.720 0.185 143 / 0.20)",
                      }}
                    >
                      {plan.dailyPrice}/dia
                    </span>
                    <span className="text-xs text-zinc-500">
                      + R$ {plan.setup.toLocaleString("pt-BR")} implantação
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href={WA_DEMO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full mb-5 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-px",
                    plan.highlight
                      ? "text-white shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/30"
                      : "bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.10]"
                  )}
                  style={
                    plan.highlight
                      ? { background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))" }
                      : undefined
                  }
                >
                  <CalendarCheck className="size-4" />
                  Agendar demonstração
                </a>

                {/* Limits */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {plan.limits.map((l) => (
                    <span
                      key={l}
                      className="rounded-md bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-xs text-zinc-500"
                    >
                      {l}
                    </span>
                  ))}
                </div>

                <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className={cn("size-4 shrink-0 mt-0.5", plan.highlight ? "text-brand-blue" : "text-brand-green")} />
                      <span
                        className={
                          feature.endsWith("mais:")
                            ? "font-semibold text-white"
                            : "text-zinc-400"
                        }
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <div className="mt-6 max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs text-zinc-600">
          <span>Sem fidelidade — cancele quando quiser</span>
          <span>·</span>
          <span>Dados exportáveis em até 30 dias após cancelamento</span>
          <span>·</span>
          <span>Suporte por WhatsApp incluso em todos os planos</span>
        </div>

        {/* Enterprise */}
        <div className="mt-5 max-w-5xl mx-auto">
          <div
            className="rounded-2xl border border-white/[0.08] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: "oklch(0.10 0.032 262)" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] shrink-0">
                <Building2 className="size-5 text-zinc-400" />
              </div>
              <div>
                <div className="font-display font-bold text-xl text-white">Enterprise</div>
                <div className="text-sm text-zinc-400 mt-1">
                  Redes de lojas, franquias e múltiplas unidades. Domínio próprio, customizações e suporte dedicado.
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="font-display text-xl font-bold text-white">Sob consulta</div>
              <a
                href={WA_ENTERPRISE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-white/[0.10] bg-white/[0.06] hover:bg-white/[0.12] text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
              >
                <MessageCircle className="size-4 text-brand-green" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
