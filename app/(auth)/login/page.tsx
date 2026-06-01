"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginAction } from "@/lib/actions/auth"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {})

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Entre na sua conta para acessar o sistema
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        {state.error && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert className="py-3 border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className="h-10 focus-visible:ring-primary/50"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <Link
              href="/esqueci-senha"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-10 focus-visible:ring-primary/50"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 font-semibold gap-2 mt-1"
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Entrando..." : "Entrar na conta"}
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">ou</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline underline-offset-2"
          >
            Criar conta grátis
          </Link>
        </p>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground/70 leading-relaxed">
        Ao entrar, você concorda com nossos{" "}
        <Link href="#" className="hover:text-foreground transition-colors hover:underline">
          Termos de Uso
        </Link>{" "}
        e{" "}
        <Link href="#" className="hover:text-foreground transition-colors hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  )
}
