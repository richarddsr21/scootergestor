"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { togglePaymentMethodAction, updatePaymentMethodFeesAction, type InstallmentFeeRange } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"

type Method = Tables<"payment_methods">

const TYPE_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  payment_link: "Link de pagamento",
  bank_slip: "Boleto bancário",
  other: "Outro",
}

const DEFAULT_INSTALLMENT_RANGES: InstallmentFeeRange[] = [
  { from: 1, to: 1, fee: 0 },
  { from: 2, to: 6, fee: 0 },
  { from: 7, to: 12, fee: 0 },
  { from: 13, to: 21, fee: 0 },
]

const RANGE_LABELS = ["1x (à vista)", "2x a 6x", "7x a 12x", "13x a 21x"]

function isCreditCard(type: string) {
  return type === "credit_card" || type === "cartao_credito"
}

function hasFee(type: string) {
  return type !== "cash" && type !== "dinheiro" && type !== "pix" && type !== "payment_link" && type !== "bank_slip" && type !== "boleto"
}

function parseInstallmentFees(raw: unknown): InstallmentFeeRange[] {
  if (!raw) return DEFAULT_INSTALLMENT_RANGES
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    if (Array.isArray(parsed) && parsed.length === 4) return parsed
  } catch {}
  return DEFAULT_INSTALLMENT_RANGES
}

function MethodCard({ method }: { method: Method }) {
  const [isPending, startTransition] = useTransition()
  const [feePercent, setFeePercent] = useState(method.fee_percent ?? 0)
  const [installmentFees, setInstallmentFees] = useState<InstallmentFeeRange[]>(
    () => parseInstallmentFees(method.installment_fees)
  )

  function handleToggle(active: boolean) {
    startTransition(async () => {
      const result = await togglePaymentMethodAction(method.id, active)
      if (result.error) toast.error(result.error)
      else toast.success(result.success)
    })
  }

  function handleSaveFees() {
    startTransition(async () => {
      const fees = isCreditCard(method.type) ? installmentFees : null
      const flat = isCreditCard(method.type) ? 0 : feePercent
      const result = await updatePaymentMethodFeesAction(method.id, flat, fees)
      if (result.error) toast.error(result.error)
      else toast.success(result.success)
    })
  }

  function updateRangeFee(idx: number, fee: number) {
    setInstallmentFees(prev => prev.map((r, i) => i === idx ? { ...r, fee } : r))
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{method.name}</p>
          <p className="text-sm text-muted-foreground">{TYPE_LABELS[method.type] ?? method.type}</p>
        </div>
        <Switch
          defaultChecked={method.active}
          disabled={isPending}
          onCheckedChange={handleToggle}
        />
      </div>

      {hasFee(method.type) && <div className="rounded-lg bg-muted/40 p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Taxa da maquininha
        </p>

        {isCreditCard(method.type) ? (
          <div className="space-y-2">
            {installmentFees.map((range, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Label className="w-32 text-sm shrink-0">{RANGE_LABELS[idx]}</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    className="w-24 h-8 text-sm"
                    value={range.fee || ""}
                    onChange={e => updateRangeFee(idx, Math.max(0, Math.min(100, Number(e.target.value))))}
                    placeholder="0,00"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Label className="w-32 text-sm shrink-0">Taxa fixa</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                className="w-24 h-8 text-sm"
                value={feePercent || ""}
                onChange={e => setFeePercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                placeholder="0,00"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={handleSaveFees}
        >
          {isPending ? "Salvando..." : "Salvar taxas"}
        </Button>
      </div>}
    </div>
  )
}

export function PagamentosClient({ metodos }: { metodos: Method[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-normal">
          Configure as taxas cobradas pela maquininha para cada forma de pagamento. As taxas são repassadas ao cliente no momento da venda.
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {metodos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma forma de pagamento encontrada.
          </p>
        )}
        {metodos.filter(m => m.type !== "payment_link").map((m) => <MethodCard key={m.id} method={m} />)}
      </CardContent>
    </Card>
  )
}
