"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { closeCashRegisterAction, type CashMovement } from "@/lib/actions/cash"
import { buildSummary, METHOD_LABELS } from "@/lib/cash-utils"
import { Lock } from "lucide-react"

const INIT = { error: undefined, success: undefined }

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface Props {
  initialAmount: number
  movements: CashMovement[]
}

export function CloseCashSheet({ initialAmount, movements }: Props) {
  const [state, action, pending] = useActionState(closeCashRegisterAction, INIT)
  const [actualCash, setActualCash] = useState("")

  useEffect(() => {
    if (state.success) toast.success(state.success)
    if (state.error) toast.error(state.error)
  }, [state])

  const parsedActual = parseFloat(actualCash.replace(",", "."))
  const summary = buildSummary(
    initialAmount,
    movements,
    isNaN(parsedActual) ? null : parsedActual
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lock className="mr-2 h-4 w-4" />
          Fechar Caixa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Resumo de entradas */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-semibold">Resumo do dia</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fundo inicial</span>
              <span>{fmt(summary.initial_amount)}</span>
            </div>
            {summary.entries_by_method.map((m) => (
              <div key={m.method} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="text-emerald-600 font-medium">+{fmt(m.total)}</span>
              </div>
            ))}
            {summary.total_sangrias > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sangrias</span>
                <span className="text-red-500 font-medium">-{fmt(summary.total_sangrias)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>Total de entradas</span>
              <span>{fmt(summary.total_entries)}</span>
            </div>
          </div>

          {/* Conferência de dinheiro (opcional) */}
          {summary.expected_cash > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">Conferência em dinheiro <span className="text-muted-foreground font-normal">(opcional)</span></p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Esperado na gaveta</span>
                <span className="font-medium">{fmt(summary.expected_cash)}</span>
              </div>
              {summary.difference !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diferença</span>
                  <span className={`font-semibold ${summary.difference === 0 ? "text-emerald-600" : summary.difference > 0 ? "text-blue-600" : "text-red-500"}`}>
                    {summary.difference >= 0 ? "+" : ""}{fmt(summary.difference)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Formulário de fechamento */}
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="actual_cash_amount">
                Dinheiro contado na gaveta (R$)
                <span className="ml-1 text-xs text-muted-foreground">— opcional</span>
              </Label>
              <Input
                id="actual_cash_amount"
                name="actual_cash_amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Deixe em branco se não houver dinheiro"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Alguma observação sobre o fechamento..."
                rows={2}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Fechando..." : "Confirmar fechamento"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
