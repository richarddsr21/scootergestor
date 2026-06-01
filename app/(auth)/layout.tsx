import * as React from "react"
import Link from "next/link"
import { Zap } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      {/* Left — branding dark panel */}
      <div className="hidden lg:flex lg:w-[420px] flex-col bg-brand-navy p-10 relative overflow-hidden shrink-0">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-brand-blue/[0.06] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-brand-green/[0.05] blur-[80px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-blue shadow-lg shadow-brand-blue/25">
            <Zap className="size-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg text-white">ScooterGestor</span>
        </Link>

        {/* Tagline */}
        <div className="mt-auto relative z-10">
          <h2 className="font-display text-2xl font-bold text-white leading-snug mb-3">
            Gestão completa para lojas de scooters elétricas
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Controle vendas, estoque, ordens de serviço e financeiro em uma plataforma moderna.
          </p>

          <div className="flex flex-col gap-3">
            {[
              "Oficina digital com OS completa",
              "Baixa automática de estoque",
              "Dashboard com faturamento em tempo real",
              "Implantação assistida incluída",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="size-1.5 rounded-full bg-brand-green shrink-0" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-brand-white">
        {/* Mobile logo only */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-blue">
              <Zap className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-base text-foreground">ScooterGestor</span>
          </Link>
        </div>

        {children}
      </div>
    </div>
  )
}
