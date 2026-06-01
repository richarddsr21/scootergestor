import { MessageCircle, Zap } from "lucide-react"

const WA_LINK = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`

const flowSteps = [
  { label: "Cliente chega", color: "bg-zinc-600 text-zinc-200" },
  { label: "Abre OS", color: "bg-brand-blue/80 text-white" },
  { label: "Checklist", color: "bg-sky-500/80 text-white" },
  { label: "Diagnóstico", color: "bg-violet-500/80 text-white" },
  { label: "Orçamento", color: "bg-amber-500/80 text-white" },
  { label: "Manutenção", color: "bg-orange-500/80 text-white" },
  { label: "Entrega", color: "bg-brand-green/80 text-white" },
]

const statusBadges = [
  { label: "Aberta", color: "bg-zinc-700 text-zinc-300 border-zinc-600" },
  { label: "Em diagnóstico", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { label: "Aguard. aprovação", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "Em manutenção", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { label: "Aguard. peça", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { label: "Concluída", color: "bg-brand-blue/20 text-brand-blue border-brand-blue/30" },
  { label: "Entregue", color: "bg-brand-green/20 text-brand-green border-brand-green/30" },
]

const osFeatures = [
  "Checklist de entrada personalizado por loja",
  "Diagnóstico com descrição e fotos",
  "Orçamento com peças e mão de obra",
  "Baixa automática de estoque ao concluir",
  "Garantia registrada na própria OS",
  "Status personalizados por loja",
  "Histórico da scooter por placa",
  "Mensagem WhatsApp pronta para enviar",
]

export function WorkshopSection() {
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: "oklch(0.085 0.030 255)" }}>
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] rounded-full bg-brand-blue/[0.04] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue mb-4">
            <Zap className="size-3" />
            Módulo Oficina
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            A oficina deixa de ser bagunça e vira processo
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
            Cada scooter passa por um fluxo digital claro, do recebimento à entrega. Sem OS no papel,
            sem cliente sem resposta, sem técnico perdido no que fazer a seguir.
          </p>
        </div>

        {/* Flow visual */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {flowSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${step.color}`}>
                  {step.label}
                </div>
                {i < flowSteps.length - 1 && (
                  <span className="text-zinc-600 text-sm">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Status badges */}
          <div className="mt-6">
            <p className="text-xs text-zinc-500 text-center mb-3 uppercase tracking-wide font-medium">Status personalizáveis da OS</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {statusBadges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start max-w-5xl mx-auto">
          {/* Features list */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-xl font-bold text-white">O que cada OS inclui</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {osFeatures.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="size-1.5 rounded-full bg-brand-blue shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start h-10 px-5 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-blue/20 mt-2"
            >
              <MessageCircle className="size-4" />
              Ver demonstração da oficina
            </a>
          </div>

          {/* OS mockup card */}
          <div
            className="rounded-xl border border-white/[0.08] p-5 flex flex-col gap-4"
            style={{ background: "oklch(0.115 0.035 255)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">Ordem de Serviço</div>
                <div className="font-display font-bold text-white text-lg mt-0.5">OS #0042</div>
              </div>
              <div className="rounded-full bg-orange-500/15 text-orange-400 text-xs font-medium px-3 py-1 border border-orange-500/25">
                Em Manutenção
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-zinc-500 mb-0.5">Cliente</div>
                <div className="text-white font-medium">João Silva</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-0.5">Scooter</div>
                <div className="text-white font-medium">Xiaomi Pro 2</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-0.5">Técnico</div>
                <div className="text-white font-medium">Carlos</div>
              </div>
            </div>

            <div
              className="rounded-lg border border-white/[0.06] p-3"
              style={{ background: "oklch(0.10 0.030 256)" }}
            >
              <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wide">Diagnóstico</div>
              <p className="text-xs text-zinc-300">Bateria com queda de tensão. Controlador apresentando falha intermitente. Necessária substituição de ambos.</p>
            </div>

            <div className="border-t border-white/[0.06] pt-3">
              <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wide">Peças e Serviços</div>
              {[
                { desc: "Bateria 48v 20Ah", qty: 1, price: "R$ 480,00" },
                { desc: "Controlador BLDC 48v", qty: 1, price: "R$ 220,00" },
                { desc: "Mão de obra", qty: 1, price: "R$ 120,00" },
              ].map((item) => (
                <div key={item.desc} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-zinc-300">{item.desc}</span>
                  <span className="text-white font-medium">{item.price}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-2.5 mt-1">
                <span className="text-zinc-400">Total</span>
                <span className="font-display font-bold text-brand-green text-sm">R$ 820,00</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[10px] text-zinc-500">Garantia registrada automaticamente</div>
              <div className="text-[10px] bg-brand-green/10 text-brand-green border border-brand-green/20 rounded px-2 py-0.5">90 dias</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
