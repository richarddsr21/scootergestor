"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginAction } from "@/lib/actions/auth"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {})
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full">

      {/* Heading */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight leading-tight">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre na sua conta para acessar o sistema
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">

        {/* Alerts */}
        {state.error && (
          <Alert variant="destructive" className="py-3 animate-fade-in">
            <AlertCircle className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert className="py-3 border-brand-green/30 bg-brand-green/[0.07] text-emerald-800 animate-fade-in">
            <CheckCircle2 className="size-4 text-brand-green" />
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5 animate-fade-up delay-100">
          <Label htmlFor="email" className="text-sm font-medium">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className="h-11 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:border-brand-blue transition-colors"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 animate-fade-up delay-150">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <Link
              href="/esqueci-senha"
              className="text-xs text-muted-foreground hover:text-brand-blue transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 bg-white shadow-sm pr-10 focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:border-brand-blue transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-1 animate-fade-up delay-200">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-gradient-to-r from-brand-blue to-[#0369a1] hover:from-brand-blue/90 hover:to-[#0284c7] text-white font-semibold shadow-md shadow-brand-blue/25 hover:shadow-lg hover:shadow-brand-blue/40 active:scale-[0.99] transition-all duration-200 gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Entrando..." : "Entrar na conta"}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative animate-fade-up delay-300">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-brand-white px-3 text-muted-foreground uppercase tracking-wider">ou</span>
          </div>
        </div>

        {/* Register CTA */}
        <p className="text-center text-sm text-muted-foreground animate-fade-up delay-400">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-blue hover:text-brand-blue/80 hover:underline underline-offset-2 transition-colors"
          >
            Criar conta grátis
          </Link>
        </p>

      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground/60 leading-relaxed animate-fade-in delay-500">
        Ao entrar, você concorda com nossos{" "}
        <Link href="/termos-de-uso" className="hover:text-muted-foreground transition-colors hover:underline">
          Termos de Uso
        </Link>{" "}
        e{" "}
        <Link href="/politica-de-privacidade" className="hover:text-muted-foreground transition-colors hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  )
}
