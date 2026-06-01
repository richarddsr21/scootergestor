import * as React from "react"
import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </div>
            <span className="font-bold text-lg">ScooterGestor</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/planos" className="text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </Link>
            <Link href="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Demonstração
            </Link>
            <Link href="/contato" className="text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded bg-primary text-primary-foreground">
              <Zap className="size-3" />
            </div>
            <span className="font-medium text-foreground">ScooterGestor</span>
            <span>— Sistema para lojas de scooters elétricas</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/politica-de-privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <Link href="/termos-de-uso" className="hover:text-foreground transition-colors">
              Termos
            </Link>
            <span>© {new Date().getFullYear()} ScooterGestor</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
