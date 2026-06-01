"use client"

import * as React from "react"
import Link from "next/link"
import { Zap, Menu, X, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const WA_LINK = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma loja de scooters elétricas e quero agendar uma demonstração do ScooterGestor.")}`

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
]

export function LandingNav() {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-brand-navy/95 backdrop-blur-xl border-b border-white/[0.06] shadow-xl shadow-black/40"
          : "bg-transparent"
      )}
    >
      {/* Gradient accent bar — only when scrolled */}
      {scrolled && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.645 0.176 216 / 0.8) 30%, oklch(0.720 0.185 143 / 0.8) 70%, transparent)",
          }}
        />
      )}

      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div
            className="relative flex size-8 items-center justify-center rounded-lg shadow-lg transition-shadow group-hover:shadow-brand-blue/40"
            style={{
              background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 200))",
              boxShadow: "0 0 16px oklch(0.645 0.176 216 / 0.35)",
            }}
          >
            <Zap className="size-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-[15px] text-white tracking-tight">
              ScooterGestor
            </span>
            <span className="text-[10px] text-zinc-500 hidden sm:block">
              Gestão para scooters elétricas
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-3.5 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200 group"
            >
              {l.label}
              <span className="absolute bottom-0.5 left-3.5 right-3.5 h-px bg-brand-blue scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-white/[0.06] text-sm"
            asChild
          >
            <Link href="/login">Entrar</Link>
          </Button>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-brand-blue/30 hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))",
            }}
          >
            <CalendarCheck className="size-3.5" />
            Agendar demonstração
          </a>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-zinc-400 hover:text-white hover:bg-white/[0.07]"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-white/[0.07] bg-brand-navy/98 backdrop-blur-xl px-4 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-zinc-300 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-white/[0.07]">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-zinc-300 bg-transparent hover:bg-white/[0.07] hover:text-white"
              asChild
            >
              <Link href="/login">Entrar no sistema</Link>
            </Button>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-white text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, oklch(0.645 0.176 216), oklch(0.55 0.18 210))",
              }}
            >
              <CalendarCheck className="size-4" />
              Agendar demonstração
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
