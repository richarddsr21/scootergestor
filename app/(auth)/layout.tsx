import * as React from "react"
import Link from "next/link"
import { Zap, Store, TrendingUp, Star } from "lucide-react"

const features = [
  "Oficina digital com OS completa",
  "Baixa automática de estoque",
  "Dashboard financeiro em tempo real",
  "Implantação assistida incluída",
]

const stats = [
  { icon: Store, value: "1.200+", label: "Lojas ativas" },
  { icon: Star, value: "98%", label: "Satisfação" },
  { icon: TrendingUp, value: "R$ 4,2M", label: "Gerenciado/mês" },
]

const featureClasses = [
  "animate-slide-right delay-200",
  "animate-slide-right delay-300",
  "animate-slide-right delay-400",
  "animate-slide-right delay-500",
]

const statClasses = [
  "animate-fade-up delay-700",
  "animate-fade-up delay-800",
  "animate-fade-up delay-900",
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      {/* ─── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[460px] flex-col bg-brand-navy p-10 relative overflow-hidden shrink-0">

        {/* Dot grid */}
        <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(14,165,233,0.13)_1px,transparent_1px)] [background-size:28px_28px] opacity-60 pointer-events-none" />

        {/* Scan line */}
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent animate-scan-line pointer-events-none" />

        {/* Ambient orbs */}
        <div className="absolute -top-20 -right-20 w-[380px] h-[380px] rounded-full bg-brand-blue/[0.07] blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full bg-brand-green/[0.06] blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-[30%] w-[180px] h-[180px] rounded-full bg-brand-blue/[0.04] blur-[80px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10 animate-fade-in">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue shadow-lg shadow-brand-blue/40 animate-glow-pulse">
            <Zap className="size-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">ScooterGestor</span>
        </Link>

        {/* Content block — pushed to bottom */}
        <div className="mt-auto relative z-10 flex flex-col gap-6">

          {/* Live status */}
          <div className="flex items-center gap-2 animate-fade-in delay-100">
            <div className="size-2 rounded-full bg-brand-green animate-blink-dot" />
            <span className="text-[11px] font-mono text-brand-green uppercase tracking-[0.15em]">
              Sistema operacional
            </span>
          </div>

          {/* Tagline */}
          <div>
            <h2 className="font-display text-[1.75rem] font-bold text-white leading-tight mb-3 animate-fade-up delay-150">
              Gestão completa para lojas de scooters elétricas
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed animate-fade-up delay-200">
              Controle vendas, estoque, ordens de serviço e financeiro em uma plataforma moderna.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2.5">
            {features.map((item, i) => (
              <div key={item} className={`flex items-center gap-3 ${featureClasses[i]}`}>
                <div className="size-1.5 rounded-full bg-brand-green shrink-0" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>

          {/* Stats widget */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-4 animate-fade-up delay-600">
            <div className="grid grid-cols-3 gap-3 divide-x divide-white/[0.07]">
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div key={label} className={`flex flex-col items-center text-center px-2 first:pl-0 last:pr-0 ${statClasses[i]}`}>
                  <Icon className="size-3.5 text-brand-blue mb-2 opacity-70" />
                  <span className="font-display font-bold text-base text-white leading-none">{value}</span>
                  <span className="text-[10px] text-zinc-500 mt-1 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── Right panel (form) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background relative">
        {/* Subtle radial top-light */}
        <div className="absolute inset-0 [background-image:radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(14,165,233,0.06),transparent)] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 animate-fade-in">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-blue shadow-md shadow-brand-blue/30">
              <Zap className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-base text-foreground tracking-tight">ScooterGestor</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}
