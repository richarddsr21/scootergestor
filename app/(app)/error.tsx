"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <div className="space-y-2 mb-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Erro inesperado</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Algo deu errado</h1>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          Ocorreu um erro ao carregar esta página. Tente novamente ou entre em contato com o suporte.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block mt-1">
            ref: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="size-4 mr-1.5" />
          Tentar novamente
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard">Ir para o Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
