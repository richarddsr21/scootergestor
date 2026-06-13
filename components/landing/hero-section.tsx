import {
  CalendarCheck,
  Zap,
  ArrowRight,
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Bell,
  Star,
} from "lucide-react"

const WA_LINK = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`

const stats = [
  { value: "12+", label: "lojas em operação" },
  { value: "8.500+", label: "OS processadas" },
  { value: "100%", label: "implantação assistida" },
]

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Clientes", icon: Users, active: false },
  { label: "Produtos", icon: Package, active: false },
  { label: "Estoque", icon: Boxes, active: false, badge: true },
  { label: "Vendas", icon: ShoppingCart, active: false },
  { label: "Oficina", icon: Wrench, active: false },
  { label: "Financeiro", icon: DollarSign, active: false },
]

const kpiCards = [
  {
    label: "Faturamento mês",
    value: "R$ 28.4k",
    delta: "+18%",
    color: "text-brand-green",
    deltaBg: "bg-brand-green/10 text-brand-green",
    icon: TrendingUp,
    bars: [38, 55, 45, 70, 60, 85, 72],
    barColor: "oklch(0.720 0.185 143 / 0.6)",
    barColorActive: "oklch(0.720 0.185 143)",
  },
  {
    label: "OS abertas",
    value: "12",
    delta: "3 urgentes",
    color: "text-orange-400",
    deltaBg: "bg-orange-500/10 text-orange-400",
    icon: Wrench,
    bars: [60, 75, 55, 80, 70, 65, 85],
    barColor: "oklch(0.70 0.17 55 / 0.5)",
    barColorActive: "oklch(0.70 0.17 55)",
  },
  {
    label: "Vendas do dia",
    value: "R$ 3.240",
    delta: "+12% hoje",
    color: "text-brand-blue",
    deltaBg: "bg-brand-blue/10 text-brand-blue",
    icon: ShoppingCart,
    bars: [30, 45, 35, 60, 50, 72, 65],
    barColor: "oklch(0.645 0.176 216 / 0.5)",
    barColorActive: "oklch(0.645 0.176 216)",
  },
  {
    label: "Estoque baixo",
    value: "3 itens",
    delta: "atenção",
    color: "text-red-400",
    deltaBg: "bg-red-500/10 text-red-400",
    icon: AlertTriangle,
    bars: [20, 25, 30, 20, 35, 25, 30],
    barColor: "oklch(0.60 0.22 25 / 0.5)",
    barColorActive: "oklch(0.60 0.22 25)",
  },
]

const recentOs = [
  { id: "#0042", name: "Xiaomi Pro 2 · João S.", status: "Em manutenção", statusColor: "bg-violet-500/20 text-violet-400 border-violet-500/25" },
  { id: "#0041", name: "Patinete 48v · Ana M.", status: "Pronta p/ entrega", statusColor: "bg-brand-green/20 text-brand-green border-brand-green/25" },
  { id: "#0040", name: "X13 STREET · Pedro L.", status: "Aguard. peça", statusColor: "bg-amber-500/20 text-amber-400 border-amber-500/25" },
]

const chartBars = [38, 55, 48, 72, 61, 88, 74]
const chartDays = ["S", "T", "Q", "Q", "S", "S", "D"]

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-brand-navy pt-28 pb-16 md:pt-40 md:pb-24 scroll-mt-16"
    >
      {/* Background layers */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.8) 1px, transparent 1px), linear-gradient(to right, oklch(1 0 0 / 0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Speed lines */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-55deg, transparent, transparent 44px, oklch(0.645 0.176 216) 44px, oklch(0.645 0.176 216) 45px)",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute -top-20 left-1/3 w-[800px] h-[600px] rounded-full bg-brand-blue/[0.09] blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[400px] rounded-full bg-brand-green/[0.07] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-brand-blue/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">

          {/* Badge */}
          <div className="animate-fade-up flex items-center gap-2 rounded-full border border-brand-green/35 bg-brand-green/10 px-4 py-1.5 text-xs font-medium text-brand-green">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-brand-green" />
            </span>
            Software especializado · 12+ lojas ativas · Feito para o mercado brasileiro
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Pare de improvisar.{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.645 0.176 216) 0%, oklch(0.720 0.185 143) 100%)",
              }}
            >
              Controle tudo
            </span>{" "}
            na sua loja de scooters.
          </h1>

          <p className="animate-fade-up delay-200 text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Diga adeus ao papel, à planilha e ao improviso. O ScooterGestor centraliza
            OS, estoque, vendas, garantias e financeiro — em um sistema feito do zero
            para lojas e oficinas de scooters elétricas.
          </p>

          {/* Stats */}
          <div className="animate-fade-up delay-300 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-1">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                {i > 0 && <div className="hidden sm:block w-px h-8 bg-white/10" />}
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-brand-green leading-none">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="animate-fade-up delay-400 flex flex-col sm:flex-row gap-3 mt-1">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden animate-glow-pulse inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-white font-bold text-base transition-all duration-200 hover:-translate-y-px hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, oklch(0.645 0.176 216) 0%, oklch(0.55 0.18 210) 100%)",
                boxShadow: "0 0 24px oklch(0.645 0.176 216 / 0.45)",
              }}
            >
              <CalendarCheck className="size-4" />
              Ver o sistema ao vivo
              {/* shimmer */}
              <span
                className="absolute inset-0 -translate-x-full animate-shimmer"
                style={{
                  background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.12), transparent)",
                }}
              />
            </a>
            <a
              href="#planos"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl border border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/[0.10] hover:text-white font-medium text-base transition-all duration-200 hover:-translate-y-px"
            >
              Ver planos e preços
              <ArrowRight className="size-4" />
            </a>
          </div>

          {/* Social proof row */}
          <div className="animate-fade-up delay-500 flex flex-wrap items-center justify-center gap-4">
            <p className="text-xs text-zinc-500">
              Implantação em 2–3 dias úteis · Treinamento incluso · Sem necessidade de cartão
            </p>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-up delay-600 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Star, text: "Desenvolvido com lojas reais" },
              { icon: Zap, text: "Suporte direto via WhatsApp" },
            ].map((t) => {
              const Icon = t.icon
              return (
                <div key={t.text} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <Icon className="size-3 text-zinc-700" />
                  {t.text}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Dashboard Mockup ─────────────────────────────── */}
        <div className="animate-fade-up delay-700 mx-auto mt-16 max-w-5xl">
          <div
            className="rounded-2xl p-px shadow-2xl shadow-black/70"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.645 0.176 216 / 0.40) 0%, oklch(0.720 0.185 143 / 0.15) 50%, transparent 80%)",
            }}
          >
            <div className="rounded-2xl overflow-hidden border border-white/[0.05]" style={{ background: "oklch(0.09 0.028 255)" }}>
              {/* Browser bar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06]" style={{ background: "oklch(0.07 0.025 255)" }}>
                <div className="flex gap-1.5 shrink-0">
                  <div className="size-3 rounded-full bg-red-500/60" />
                  <div className="size-3 rounded-full bg-yellow-500/60" />
                  <div className="size-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-2 h-5 rounded-md bg-white/[0.05] text-[11px] flex items-center px-2.5 text-zinc-500 gap-1.5">
                  <span className="size-1.5 rounded-full bg-brand-green animate-blink-dot shrink-0" />
                  app.scootergestor.com.br/dashboard
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <div className="hidden sm:flex size-5 rounded items-center justify-center hover:bg-white/[0.07] transition-colors cursor-pointer">
                    <Bell className="size-3 text-zinc-500" />
                  </div>
                </div>
              </div>

              {/* App shell */}
              <div className="flex" style={{ height: "340px" }}>
                {/* Sidebar */}
                <div
                  className="hidden sm:flex w-44 flex-col border-r border-white/[0.05] p-2.5 gap-0.5 shrink-0"
                  style={{ background: "oklch(0.072 0.032 255)" }}
                >
                  {/* Logo */}
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
                    <div
                      className="size-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))" }}
                    >
                      <Zap className="size-3.5 text-white" />
                    </div>
                    <span className="font-display text-[11px] font-bold text-white tracking-wide">ScooterGestor</span>
                  </div>

                  {/* Group: Principal */}
                  <span className="px-2.5 mb-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Principal</span>
                  {sidebarItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors relative"
                        style={
                          item.active
                            ? {
                                background: "oklch(0.645 0.176 216 / 0.15)",
                                color: "oklch(0.645 0.176 216)",
                                borderLeft: "2px solid oklch(0.645 0.176 216)",
                                paddingLeft: "8px",
                              }
                            : { color: "oklch(0.55 0.025 255)" }
                        }
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {item.label}
                        {item.badge && (
                          <span className="ml-auto size-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Main content */}
                <div className="flex-1 p-3.5 flex flex-col gap-3 min-w-0 overflow-hidden">
                  {/* Page header */}
                  <div className="flex items-center justify-between">
                    <div className="font-display text-sm font-bold text-white">Visão Geral</div>
                    <div className="text-[11px] text-zinc-500 tabular-nums">31 mai. 2025</div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {kpiCards.map((card) => {
                      const Icon = card.icon
                      return (
                        <div
                          key={card.label}
                          className="rounded-lg border border-white/[0.06] p-2.5 flex flex-col gap-1.5"
                          style={{ background: "oklch(0.12 0.028 255)" }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wide font-medium leading-tight">{card.label}</span>
                            <Icon className={`size-3 ${card.color} shrink-0`} />
                          </div>
                          <div className={`text-sm font-bold font-display ${card.color}`}>{card.value}</div>
                          {/* Mini sparkline bars */}
                          <div className="flex items-end gap-0.5 h-5">
                            {card.bars.map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-t-sm"
                                style={{
                                  height: `${h}%`,
                                  background: i === card.bars.length - 1 ? card.barColorActive : card.barColor,
                                }}
                              />
                            ))}
                          </div>
                          <div className={`inline-flex items-center rounded text-[9px] font-medium px-1.5 py-0.5 self-start ${card.deltaBg}`}>
                            {card.delta}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Bottom row: chart + OS list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 min-h-0">
                    {/* Revenue chart */}
                    <div
                      className="rounded-lg border border-white/[0.06] p-3 flex flex-col"
                      style={{ background: "oklch(0.12 0.028 255)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-zinc-300">Faturamento — 7 dias</span>
                        <span className="text-[9px] text-brand-green font-medium">+14.2%</span>
                      </div>
                      <div className="flex items-end gap-1 flex-1">
                        {chartBars.map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className="w-full rounded-t-sm transition-all"
                              style={{
                                height: `${h}%`,
                                background:
                                  i === chartBars.length - 1
                                    ? "linear-gradient(180deg, oklch(0.645 0.176 216), oklch(0.645 0.176 216 / 0.6))"
                                    : "oklch(0.645 0.176 216 / 0.22)",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {chartDays.map((d, i) => (
                          <div
                            key={i}
                            className="flex-1 text-center text-[9px]"
                            style={{ color: i === 6 ? "oklch(0.645 0.176 216)" : "oklch(0.40 0.02 255)" }}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OS list */}
                    <div
                      className="rounded-lg border border-white/[0.06] p-3 flex flex-col"
                      style={{ background: "oklch(0.12 0.028 255)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-zinc-300">OS Recentes</span>
                        <span className="text-[9px] text-zinc-500">12 abertas</span>
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        {recentOs.map((os) => (
                          <div key={os.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[9px] font-mono text-brand-blue shrink-0 font-semibold">{os.id}</span>
                              <span className="text-[9px] text-zinc-400 truncate">{os.name}</span>
                            </div>
                            <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded border ${os.statusColor}`}>
                              {os.status}
                            </span>
                          </div>
                        ))}
                        {/* mini oficina status row */}
                        <div className="mt-auto pt-2 border-t border-white/[0.05]">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="size-2.5 text-zinc-600" />
                            <span className="text-[9px] text-zinc-600">Status da oficina</span>
                          </div>
                          <div className="flex gap-1.5 mt-1.5">
                            {[
                              { label: "Em serviço", count: 5, color: "bg-violet-500/70" },
                              { label: "Aguardando", count: 4, color: "bg-amber-500/70" },
                              { label: "Prontas", count: 3, color: "bg-brand-green/70" },
                            ].map((s) => (
                              <div key={s.label} className="flex-1 rounded bg-white/[0.04] border border-white/[0.05] p-1.5 text-center">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <div className={`size-1.5 rounded-full ${s.color}`} />
                                </div>
                                <div className="text-[10px] font-bold text-white">{s.count}</div>
                                <div className="text-[8px] text-zinc-600 leading-tight">{s.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
