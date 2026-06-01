import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-muted">
        <Compass className="size-10 text-muted-foreground" />
      </div>
      <div className="space-y-2 mb-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Erro 404</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          O recurso que você procura não existe ou foi removido. Verifique o endereço ou volte ao início.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="javascript:history.back()">Voltar</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard">Ir para o Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
