"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2, XCircle } from "lucide-react"

interface Props {
  token: string
}

type State = "idle" | "loading" | "success" | "error"

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Você precisa estar logado para aceitar o convite.",
  invalid_or_expired_token: "Este convite é inválido ou já expirou.",
  already_member: "Você já é membro desta empresa.",
}

export function AcceptInviteClient({ token }: Props) {
  const router = useRouter()
  const [state, setState] = React.useState<State>("idle")
  const [errorMsg, setErrorMsg] = React.useState<string>("")

  async function handleAccept() {
    setState("loading")
    const supabase = createClient()

    const { error } = await supabase.rpc("accept_invitation", { p_token: token })

    if (error) {
      const msg =
        ERROR_MESSAGES[error.message] ?? "Erro ao aceitar convite. Tente novamente."
      setErrorMsg(msg)
      setState("error")
      return
    }

    setState("success")
    setTimeout(() => router.push("/dashboard"), 2000)
  }

  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Convite aceito!</h2>
            <p className="text-muted-foreground text-sm">
              Você foi adicionado à empresa com sucesso. Redirecionando para o painel...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Erro ao aceitar convite</h2>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
            <Button variant="outline" onClick={() => setState("idle")}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>
            Clique no botão abaixo para aceitar o convite e entrar na empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleAccept}
            disabled={state === "loading"}
            size="lg"
            className="w-full"
          >
            {state === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {state === "loading" ? "Aceitando..." : "Aceitar convite"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
