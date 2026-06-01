import Link from "next/link"
import { Zap, MessageCircle, Mail, MapPin, Shield, Clock, Star } from "lucide-react"

const WA_LINK = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Quero saber mais sobre o ScooterGestor.")}`
const WA_DEMO = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`

const modules = [
  { label: "Clientes", href: "#funcionalidades" },
  { label: "Estoque e Produtos", href: "#funcionalidades" },
  { label: "Vendas e PDV", href: "#funcionalidades" },
  { label: "Oficina e OS", href: "#funcionalidades" },
  { label: "Financeiro", href: "#funcionalidades" },
  { label: "Relatórios", href: "#funcionalidades" },
]

const productLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Planos e preços", href: "#planos" },
  { label: "FAQ", href: "#faq" },
  { label: "Agendar demonstração", href: WA_DEMO, external: true, accent: true },
]

const companyLinks = [
  { label: "Entrar no sistema", href: "/login" },
  { label: "Política de Privacidade", href: "/politica-de-privacidade" },
  { label: "Termos de Uso", href: "/termos-de-uso" },
]

const trustBadges = [
  { icon: Shield, label: "Dados isolados por loja" },
  { icon: Clock, label: "Suporte via WhatsApp" },
  { icon: MapPin, label: "Desenvolvido no Brasil" },
  { icon: Star, label: "Criado com lojas reais" },
]

export function LandingFooter() {
  return (
    <footer style={{ background: "oklch(0.055 0.020 255)" }} className="border-t border-white/[0.06] text-zinc-400">
      {/* Top divider accent */}
      <div
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.645 0.176 216 / 0.4) 30%, oklch(0.720 0.185 143 / 0.4) 70%, transparent)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-12 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/[0.05]">

          {/* Brand */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-9 items-center justify-center rounded-xl shadow-lg"
                style={{
                  background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))",
                  boxShadow: "0 0 20px oklch(0.645 0.176 216 / 0.30)",
                }}
              >
                <Zap className="size-4.5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-base text-white">ScooterGestor</span>
                <span className="text-[10px] text-zinc-600 mt-0.5">Gestão para scooters elétricas</span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-zinc-500 max-w-xs">
              Sistema completo para lojas e oficinas de scooters elétricas. Controle
              vendas, estoque, OS, garantias e financeiro em um só lugar — feito para o Brasil.
            </p>

            <div className="flex flex-col gap-2">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-white transition-colors group"
              >
                <MessageCircle className="size-4 text-brand-green" />
                WhatsApp: (21) 9 9999-9999
              </a>
              <a
                href="mailto:contato@scootergestor.com.br"
                className="flex items-center gap-2 text-sm hover:text-white transition-colors"
              >
                <Mail className="size-4 text-zinc-600" />
                contato@scootergestor.com.br
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col gap-2 mt-1">
              {trustBadges.map((b) => {
                const Icon = b.icon
                return (
                  <div key={b.label} className="flex items-center gap-2 text-xs text-zinc-600">
                    <Icon className="size-3 shrink-0" />
                    {b.label}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Modules */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Módulos</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {modules.map((m) => (
                <li key={m.label}>
                  <a href={m.href} className="hover:text-white transition-colors text-zinc-500 hover:text-zinc-200">
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Produto</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {productLinks.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={l.accent ? "text-brand-green hover:text-brand-green/80 font-medium transition-colors" : "text-zinc-500 hover:text-zinc-200 transition-colors"}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <a href={l.href} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Empresa</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-white/[0.05]">
              <a
                href={WA_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-brand-blue/20"
                style={{
                  background: "linear-gradient(135deg, oklch(0.645 0.176 216 / 0.20), oklch(0.645 0.176 216 / 0.10))",
                  border: "1px solid oklch(0.645 0.176 216 / 0.30)",
                  color: "oklch(0.645 0.176 216)",
                }}
              >
                <Zap className="size-3.5" />
                Agendar demonstração
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-700">
          <span>© {new Date().getFullYear()} ScooterGestor. Todos os direitos reservados.</span>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-green animate-pulse" />
            <span>Feito para lojas de scooters elétricas · Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
