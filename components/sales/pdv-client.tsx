"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Trash2, ShoppingCart, CheckCircle, X, Hash, LockKeyhole } from "lucide-react"
import { confirmSaleAction, type CartItem, type PaymentEntry } from "@/lib/actions/sales"
import { openCashRegisterAction } from "@/lib/actions/cash"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { QuickCustomerDialog } from "@/components/customers/quick-customer-dialog"

const CASH_INIT = { error: undefined, success: undefined }

function CaixaFechadoDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(true)
  const [state, action, pending] = useActionState(openCashRegisterAction, CASH_INIT)

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      onSuccess()
    }
    if (state.error) toast.error(state.error)
  }, [state, onSuccess])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            <DialogTitle>Caixa fechado</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          É necessário abrir o caixa antes de registrar uma venda.
        </p>
        <form action={action} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="initial_amount">Fundo de caixa (R$)</Label>
            <Input
              id="initial_amount"
              name="initial_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              defaultValue="0"
              required
            />
            <p className="text-xs text-muted-foreground">Valor em dinheiro que já está na gaveta ao abrir.</p>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Abrindo..." : "Abrir caixa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface InstallmentFee { installments: number; fee: number }

interface PaymentMethod {
  id: string
  name: string
  type: string
  fee_percent: number
  installment_fees: InstallmentFee[] | null
}

interface Product {
  id: string
  name: string
  sku: string | null
  sale_price: number
  cost_price: number
  stock_quantity: number
  unit: string
  product_type: string
  requires_chassis: boolean
}
interface Customer { id: string; name: string; phone: string | null }

type UIPaymentEntry = { id: number; methodType: string; amount: string; installments: number }

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function isCreditCard(type: string) {
  return type === "credit_card" || type === "cartao_credito"
}

const NO_FEE_TYPES = new Set(["cash", "dinheiro", "pix", "bank_slip", "boleto"])

function getFeePercent(method: PaymentMethod, installments: number): number {
  if (NO_FEE_TYPES.has(method.type)) return 0
  if (isCreditCard(method.type) && method.installment_fees?.length) {
    const entry = method.installment_fees.find(r => r.installments === installments)
    return entry?.fee ?? 0
  }
  return method.fee_percent ?? 0
}

const INSTALLMENTS = Array.from({ length: 21 }, (_, i) => i + 1)

const FALLBACK_METHODS: PaymentMethod[] = Object.entries(PAYMENT_METHOD_LABELS)
  .filter(([type]) => type !== "payment_link")
  .map(([type, name]) => ({ id: type, name, type, fee_percent: 0, installment_fees: null }))

export function PdvClient({
  products,
  customers: initialCustomers,
  paymentMethods,
  caixaAberto = true,
}: {
  products: Product[]
  customers: Customer[]
  paymentMethods: PaymentMethod[]
  caixaAberto?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [customerId, setCustomerId] = useState<string>("none")
  const [notes, setNotes] = useState("")

  function handleCustomerCreated(customer: { id: string; name: string }) {
    setCustomers(prev => [...prev, { ...customer, phone: null }].sort((a, b) => a.name.localeCompare(b.name)))
    setCustomerId(customer.id)
  }

  // Discount
  const [chassisNumbers, setChassisNumbers] = useState<Record<string, string>>({})

  const [discountType, setDiscountType] = useState<"value" | "percent">("value")
  const [discountInput, setDiscountInput] = useState(0)

  // Payment entries
  const entryIdRef = useRef(0)
  const methods = paymentMethods.length > 0 ? paymentMethods : FALLBACK_METHODS
  const [entries, setEntries] = useState<UIPaymentEntry[]>([
    { id: entryIdRef.current++, methodType: methods[0]?.type ?? "dinheiro", amount: "", installments: 1 },
  ])

  const filtered = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : []

  function addToCart(product: Product) {
    setSearch("")
    const existing = cart.find(i => i.productId === product.id)
    if (existing) {
      if (existing.quantity >= product.stock_quantity) { toast.error("Estoque insuficiente"); return }
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sale_price,
        costPrice: product.cost_price,
        discount: 0,
        requiresChassis: product.product_type === "scooter" || product.requires_chassis,
      }])
    }
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(i => i.productId !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(cart.map(i => i.productId === productId ? { ...i, quantity: qty } : i))
  }

  function updateItemDiscount(productId: string, disc: number) {
    setCart(cart.map(i => i.productId === productId ? { ...i, discount: Math.max(0, disc) } : i))
  }

  function addEntry() {
    setEntries(prev => [...prev, {
      id: entryIdRef.current++,
      methodType: methods[0]?.type ?? "dinheiro",
      amount: "",
      installments: 1,
    }])
  }

  function removeEntry(id: number) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function updateEntry(id: number, patch: Partial<Omit<UIPaymentEntry, "id">>) {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e
      const updated = { ...e, ...patch }
      if (patch.methodType && !isCreditCard(patch.methodType)) updated.installments = 1
      return updated
    }))
  }

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0)
  const discountAmount = discountType === "percent"
    ? subtotal * Math.min(100, Math.max(0, discountInput)) / 100
    : Math.max(0, discountInput)
  const total = Math.max(0, subtotal - discountAmount)
  const isMulti = entries.length > 1

  // Per-entry fee calculation
  function entryBaseAmount(entry: UIPaymentEntry): number {
    return isMulti ? (parseFloat(entry.amount) || 0) : total
  }

  function entryFee(entry: UIPaymentEntry): number {
    const method = methods.find(m => m.type === entry.methodType)
    if (!method) return 0
    const pct = getFeePercent(method, entry.installments)
    return pct > 0 ? entryBaseAmount(entry) * pct / 100 : 0
  }

  function entryFeePercent(entry: UIPaymentEntry): number {
    const method = methods.find(m => m.type === entry.methodType)
    if (!method) return 0
    return getFeePercent(method, entry.installments)
  }

  const totalEntered = isMulti ? entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) : total
  const remaining = isMulti ? total - totalEntered : 0
  const totalFees = entries.reduce((s, e) => s + entryFee(e), 0)
  const clientTotal = total + totalFees

  function handleConfirm() {
    if (cart.length === 0) { toast.error("Adicione pelo menos um produto"); return }
    if (isMulti && Math.abs(remaining) > 0.01) {
      toast.error(`Distribua o valor completo. Faltam ${fmt(remaining)}`); return
    }

    const missingChassis = cart.filter(i => i.requiresChassis && !chassisNumbers[i.productId]?.trim())
    if (missingChassis.length > 0) {
      toast.error(`Informe o chassi: ${missingChassis.map(i => i.productName).join(", ")}`)
      return
    }

    const paymentData: PaymentEntry[] = entries.map(e => ({
      method: e.methodType,
      amount: entryBaseAmount(e),
      fee_amount: entryFee(e),
      installments: e.installments,
    }))

    const cartWithChassis = cart.map(i => ({
      ...i,
      chassisNumber: i.requiresChassis ? chassisNumbers[i.productId] : undefined,
    }))

    startTransition(async () => {
      const result = await confirmSaleAction(cartWithChassis, customerId === "none" ? null : customerId, discountAmount, paymentData, notes)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success ?? "Venda registrada!")
      if (result.saleId) router.push(`/vendas/${result.saleId}`)
    })
  }

  return (
    <>
    {!caixaAberto && <CaixaFechadoDialog onSuccess={() => router.refresh()} />}
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Buscar produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nome ou SKU do produto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {filtered.length > 0 && (
              <div className="rounded-md border divide-y">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-semibold text-emerald-600">{fmt(p.sale_price)}</p>
                      <p className="text-xs text-muted-foreground">{p.stock_quantity} {p.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carrinho vazio. Busque um produto acima.</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.productId} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{fmt(item.unitPrice)} un.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7"
                          onClick={() => updateQty(item.productId, item.quantity - 1)}>−</Button>
                        <Input
                          type="number"
                          className="w-14 h-7 text-center text-sm"
                          value={item.quantity}
                          min={1}
                          onChange={e => updateQty(item.productId, Number(e.target.value))}
                        />
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7"
                          onClick={() => updateQty(item.productId, item.quantity + 1)}>+</Button>
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          placeholder="Desc."
                          min={0}
                          step="0.01"
                          value={item.discount || ""}
                          onChange={e => updateItemDiscount(item.productId, Number(e.target.value))}
                          title="Desconto no item"
                        />
                      </div>
                      <span className="text-sm font-semibold w-20 text-right">
                        {fmt(item.unitPrice * item.quantity - item.discount)}
                      </span>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => removeFromCart(item.productId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    </div>
                    {item.requiresChassis && (
                      <div className="flex items-center gap-2 rounded-md bg-muted/40 border border-dashed px-3 py-1.5">
                        <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground shrink-0 select-none">Chassi</span>
                        <input
                          className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:text-muted-foreground/50 min-w-0"
                          placeholder="ex: 9C2JC4110SR000001"
                          value={chassisNumbers[item.productId] ?? ""}
                          onChange={e => setChassisNumbers(prev => ({ ...prev, [item.productId]: e.target.value.toUpperCase() }))}
                          spellCheck={false}
                          autoComplete="off"
                        />
                        {chassisNumbers[item.productId] && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Cliente (opcional)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickCustomerDialog onCreated={handleCustomerCreated} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* Payment entries */}
            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const feePct = entryFeePercent(entry)
                const feeAmt = entryFee(entry)
                const base = entryBaseAmount(entry)

                return (
                  <div key={entry.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      {isMulti && (
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                      )}
                      <Select
                        value={entry.methodType}
                        onValueChange={v => updateEntry(entry.id, { methodType: v })}
                      >
                        <SelectTrigger className="flex-1 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methods.map(m => (
                            <SelectItem key={m.id} value={m.type}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {entries.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => removeEntry(entry.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Amount — only in multi-payment mode */}
                    {isMulti && (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Valor (R$)"
                        className="h-8 text-sm"
                        value={entry.amount}
                        onChange={e => updateEntry(entry.id, { amount: e.target.value })}
                      />
                    )}

                    {/* Installments — only for credit card */}
                    {isCreditCard(entry.methodType) && (
                      <div className="space-y-1">
                        <Select
                          value={String(entry.installments)}
                          onValueChange={v => updateEntry(entry.id, { installments: Number(v) })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INSTALLMENTS.map(n => {
                              const perInstallment = n > 1 && base > 0 ? ` — ${fmt(base / n)}` : ""
                              return (
                                <SelectItem key={n} value={String(n)}>
                                  {n === 1 ? "1x (à vista)" : `${n}x${perInstallment}`}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        {entry.installments > 1 && base > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {entry.installments}x de {fmt(base / entry.installments)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Fee indicator */}
                    {feePct > 0 && base > 0 && (
                      <div className="flex justify-between text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
                        <span>Taxa maquininha ({feePct}%)</span>
                        <span>+{fmt(feeAmt)}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Remaining balance indicator */}
              {isMulti && (
                <div className={`flex justify-between text-sm px-1 font-medium ${Math.abs(remaining) < 0.01 ? "text-emerald-600" : "text-amber-600"}`}>
                  <span>Restante</span>
                  <span>{fmt(remaining)}</span>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={addEntry}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar outra forma de pagamento
              </Button>
            </div>

            <Separator />

            {/* Discount */}
            <div className="space-y-1.5">
              <Label>Desconto</Label>
              <div className="flex gap-1.5">
                <div className="flex rounded-md border overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setDiscountType("value")}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${discountType === "value" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    R$
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${discountType === "percent" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    %
                  </button>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={discountType === "percent" ? 100 : undefined}
                  step="0.01"
                  value={discountInput || ""}
                  onChange={e => setDiscountInput(Math.max(0, Number(e.target.value)))}
                  placeholder={discountType === "percent" ? "0%" : "0,00"}
                />
              </div>
              {discountAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Desconto: {fmt(discountAmount)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto{discountType === "percent" ? ` (${discountInput}%)` : ""}</span>
                <span>−{fmt(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-medium">
              <span>Total dos produtos</span>
              <span>{fmt(total)}</span>
            </div>
            {totalFees > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Taxa(s) maquininha</span>
                <span>+{fmt(totalFees)}</span>
              </div>
            )}
            {totalFees > 0 && <Separator />}
            <div className="flex justify-between font-bold text-lg">
              <span>Cliente paga</span>
              <span className="text-emerald-600">{fmt(clientTotal)}</span>
            </div>
            <Button
              className="w-full mt-2"
              size="lg"
              disabled={cart.length === 0 || isPending}
              onClick={handleConfirm}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {isPending ? "Processando..." : "Confirmar venda"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
