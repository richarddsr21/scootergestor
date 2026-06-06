"use client"

import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerAction } from "@/lib/actions/auth"

function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

const strengthConfig = [
  { color: "bg-red-500",      label: "Fraca",   textColor: "text-red-500" },
  { color: "bg-orange-500",   label: "Regular", textColor: "text-orange-500" },
  { color: "bg-yellow-400",   label: "Boa",     textColor: "text-yellow-500" },
  { color: "bg-brand-green",  label: "Forte",   textColor: "text-brand-green" },
]

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, {})
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite")

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const strength = password.length > 0 ? getPasswordStrength(password) : -1
  const currentStrength = strengthConfig[strength]

  return (
    <div className="w-full">

      {/* Heading */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight leading-tight">
          {inviteToken ? "Aceitar convite" : "Criar conta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {inviteToken
            ? "Crie sua conta para aceitar o convite."
            : "Comece seu período grátis. Sem cartão de crédito."}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        {inviteToken && (
          <input type="hidden" name="inviteToken" value={inviteToken} />
        )}

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

        {/* Name */}
        <div className="flex flex-col gap-1.5 animate-fade-up delay-100">
          <Label htmlFor="name" className="text-sm font-medium">
            Seu nome
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="João Silva"
            autoComplete="name"
            className="h-11 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:border-brand-blue transition-colors"
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5 animate-fade-up delay-150">
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

        {/* Password + strength meter */}
        <div className="flex flex-col gap-1.5 animate-fade-up delay-200">
          <Label htmlFor="password" className="text-sm font-medium">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {strength >= 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-1 flex-1">
                {[0, 1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      level <= strength
                        ? (currentStrength?.color ?? "bg-red-500")
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[11px] font-medium shrink-0 transition-colors ${currentStrength?.textColor ?? "text-red-500"}`}>
                {currentStrength?.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5 animate-fade-up delay-300">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmar senha
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repita a senha"
              autoComplete="new-password"
              className="h-11 bg-white shadow-sm pr-10 focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:border-brand-blue transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Free trial badge + Submit */}
        <div className="flex flex-col gap-3 mt-1 animate-fade-up delay-400">
          {!inviteToken && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand-green/[0.07] border border-brand-green/25">
              <Shield className="size-3.5 text-brand-green shrink-0" />
              <span className="text-xs font-medium text-brand-green">
                14 dias grátis · sem cartão de crédito
              </span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || !!state.success}
            className="w-full h-11 bg-gradient-to-r from-brand-blue to-[#0369a1] hover:from-brand-blue/90 hover:to-[#0284c7] text-white font-semibold shadow-md shadow-brand-blue/25 hover:shadow-lg hover:shadow-brand-blue/40 active:scale-[0.99] transition-all duration-200 gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending
              ? "Criando conta..."
              : inviteToken
                ? "Aceitar convite"
                : "Criar conta grátis"}
          </Button>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground animate-fade-up delay-500">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-blue hover:text-brand-blue/80 hover:underline underline-offset-2 transition-colors"
          >
            Entrar
          </Link>
        </p>

      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground/60 leading-relaxed animate-fade-in delay-600">
        Ao criar conta, você concorda com nossos{" "}
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
