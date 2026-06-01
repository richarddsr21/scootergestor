"use client"

import { useActionState, useState, useEffect } from "react"
import Link from "next/link"
import { Zap, Building2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCompanyAction } from "@/lib/actions/auth"
import { slugify } from "@/lib/utils"

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createCompanyAction, {})
  const [companyName, setCompanyName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)

  useEffect(() => {
    if (!slugEdited && companyName) {
      setSlug(slugify(companyName))
    }
  }, [companyName, slugEdited])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </div>
          <span className="text-xl font-bold">ScooterGestor</span>
        </Link>
        <p className="text-sm text-muted-foreground">Configuração inicial</p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-primary" />
        <span className="text-foreground font-medium">Conta criada</span>
        <div className="h-px w-8 bg-border" />
        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          2
        </div>
        <span className="text-foreground font-medium">Sua empresa</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Configure sua empresa</h1>
            <p className="text-sm text-muted-foreground">
              Essas informações podem ser alteradas depois
            </p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerName">Seu nome completo</Label>
            <Input
              id="ownerName"
              name="ownerName"
              type="text"
              placeholder="João Silva"
              autoComplete="name"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Nome da empresa</Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Loja do João Scooters"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companySlug">
              Identificador único
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (usado na URL)
              </span>
            </Label>
            <div className="flex items-center rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
              <span className="shrink-0 pl-3 text-sm text-muted-foreground select-none">
                app/
              </span>
              <Input
                id="companySlug"
                name="companySlug"
                type="text"
                placeholder="loja-do-joao"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }}
                className="border-0 focus-visible:ring-0 px-1"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          <Button
            type="submit"
            className="mt-2 w-full"
            size="lg"
            disabled={isPending || !companyName || !slug}
          >
            {isPending ? "Criando sua empresa..." : "Começar agora →"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center max-w-sm">
        Ao continuar, você concorda com nossos{" "}
        <Link href="/termos-de-uso" className="hover:underline">Termos de Uso</Link>
        {" "}e{" "}
        <Link href="/politica-de-privacidade" className="hover:underline">
          Política de Privacidade
        </Link>
      </p>
    </div>
  )
}
