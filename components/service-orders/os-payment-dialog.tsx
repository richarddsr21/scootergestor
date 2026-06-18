"use client"

import * as React from "react"
import { Loader2, Plus, Trash2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  getOsPaymentDataAction,
  payServiceOrderAction,
  type OsPaymentData,
  type OsPaymentEntry,
} from "@/lib/actions/service-orders"
import { type ReceiptProps } from "@/lib/receipt-builder"

// ─── helpers ──────────────────────────────────────────────────────────────────

interface InstallmentFee { installments: number; fee: number }

function isCreditCard(type: string) {
  return type === "credit_card" || type === "cartao_credito"
}

const NO_FEE_TYPES = new Set(["cash", "dinheiro", "pix", "bank_slip", "boleto"])

function getFeePercent(
  method: OsPaymentData["paymentMethods"][number],
  installments: number
): number {
  if (NO_FEE_TYPES.has(method.type)) return 0
  if (isCreditCard(method.type) && method.installment_fees?.length) {
    const entry = (method.installment_fees as InstallmentFee[]).find(
      (r) => r.installments === installments
    )
    return entry?.fee ?? 0
  }
  return method.fee_percent ?? 0
}

const FALLBACK_METHODS: OsPaymentData["paymentMethods"] = [
  { id: "dinheiro",  name: "Dinheiro",         type: "dinheiro",    fee_percent: 0, installment_fees: null },
  { id: "pix",       name: "PIX",               type: "pix",         fee_percent: 0, installment_fees: null },
  { id: "debito",    name: "Cartão de Débito",  type: "debit_card",  fee_percent: 0, installment_fees: null },
  { id: "credito",   name: "Cartão de Crédito", type: "credit_card", fee_percent: 0, installment_fees: null },
]

const INSTALLMENTS = Array.from({ length: 12 }, (_, i) => i + 1)

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

type UIEntry = { id: number; methodId: string; amount: string; installments: number }

// ─── dialog ───────────────────────────────────────────────────────────────────

interface Props {
  osId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (receipt: ReceiptProps) => void
}

export function OsPaymentDialog({ osId, open, onOpenChange, onSuccess }: Props) {
  const [osData, setOsData] = React.useState<OsPaymentData | null>(null)
  const [loadingData, setLoadingData] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const entryIdRef = React.useRef(0)
  const [entries, setEntries] = React.useState<UIEntry[]>([])

  React.useEffect(() => {
    if (!open) return
    setLoadingData(true)
    getOsPaymentDataAction(osId).then((data) => {
      setOsData(data)
      const methods = data?.paymentMethods.length ? data.paymentMethods : FALLBACK_METHODS
      setEntries([
        { id: entryIdRef.current++, methodId: methods[0].id, amount: String(data?.total ?? ""), installments: 1 },
      ])
      setLoadingData(false)
    })
  }, [open, osId])

  const methods = osData?.paymentMethods.length ? osData.paymentMethods : FALLBACK_METHODS
  const total = osData?.total ?? 0

  const totalPaid = entries.reduce((s, e) => {
    const method = methods.find((m) => m.id === e.methodId)
    const base = parseFloat(e.amount) || 0
    const fee = method ? (base * getFeePercent(method, e.installments)) / 100 : 0
    return s + base + fee
  }, 0)

  const remaining = Math.max(0, total - totalPaid)

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      { id: entryIdRef.current++, methodId: methods[0].id, amount: String(remaining.toFixed(2)), installments: 1 },
    ])
  }

  function removeEntry(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function updateEntry(id: number, patch: Partial<UIEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function handleConfirm() {
    if (totalPaid < total * 0.01) {
      toast.error("Informe o valor pago")
      return
    }

    const payload: OsPaymentEntry[] = entries.map((e) => {
      const method = methods.find((m) => m.id === e.methodId)!
      const base = parseFloat(e.amount) || 0
      const feePercent = getFeePercent(method, e.installments)
      const fee_amount = (base * feePercent) / 100
      return { method: method.type, amount: base + fee_amount, fee_amount, installments: e.installments }
    })

    startTransition(async () => {
      const result = await payServiceOrderAction(osId, payload)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Pagamento registrado")

      if (osData) {
        const receipt: ReceiptProps = {
          saleNumber: osData.orderNumber,
          createdAt: new Date().toISOString(),
          items: osData.items.map((item) => ({
            name: item.name,
            sku: null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: 0,
            total: item.total,
          })),
          subtotal: osData.subtotal,
          discount: osData.discount,
          total: osData.total,
          payments: payload.map((e) => ({
            method: e.method,
            amount: e.amount - e.fee_amount,
            feeAmount: e.fee_amount,
            installments: e.installments,
          })),
          customerName: osData.customerName,
          customerWhatsapp: osData.customerWhatsapp,
          storeName: osData.storeName,
          storeCnpj: osData.storeCnpj,
          storePhone: osData.storePhone,
        }
        onSuccess?.(receipt)
      }

      onOpenChange(false)
    })
  }

  const alreadyPaid = osData?.payment_status === "pago"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            Registrar pagamento
          </DialogTitle>
        </DialogHeader>

        {loadingData && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loadingData && alreadyPaid && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Esta OS já está paga.
          </div>
        )}

        {!loadingData && !alreadyPaid && osData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total da OS</span>
              <span className="text-lg font-bold text-emerald-600">{fmt(total)}</span>
            </div>

            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const method = methods.find((m) => m.id === entry.methodId) ?? methods[0]
                const showInstallments = isCreditCard(method.type)
                const base = parseFloat(entry.amount) || 0
                const feePercent = getFeePercent(method, entry.installments)
                const feeAmt = (base * feePercent) / 100

                return (
                  <div key={entry.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Pagamento {idx + 1}
                      </span>
                      {entries.length > 1 && (
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Label className="text-xs">Forma de pagamento</Label>
                        <Select
                          value={entry.methodId}
                          onValueChange={(v) => updateEntry(entry.id, { methodId: v, installments: 1 })}
                        >
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {methods.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Valor (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={entry.amount}
                          onChange={(e) => updateEntry(entry.id, { amount: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {showInstallments && (
                        <div>
                          <Label className="text-xs">Parcelas</Label>
                          <Select
                            value={String(entry.installments)}
                            onValueChange={(v) => updateEntry(entry.id, { installments: Number(v) })}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INSTALLMENTS.map((n) => (
                                <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {feeAmt > 0 && (
                      <p className="text-[10px] text-amber-600">
                        Taxa {feePercent}% = {fmt(feeAmt)} · Total cobrado: {fmt(base + feeAmt)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={addEntry}
              disabled={remaining <= 0}
            >
              <Plus className="size-3.5" />
              Adicionar forma de pagamento
            </Button>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total pago</span>
                <span className={totalPaid >= total ? "text-emerald-600 font-medium" : ""}>{fmt(totalPaid)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Restante</span>
                  <span>{fmt(remaining)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Pagar depois
          </Button>
          {!alreadyPaid && !loadingData && (
            <Button size="sm" onClick={handleConfirm} disabled={isPending || loadingData}>
              {isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
              Confirmar pagamento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
