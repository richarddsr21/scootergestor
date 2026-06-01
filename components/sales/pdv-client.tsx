"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Trash2, ShoppingCart, CheckCircle } from "lucide-react"
import { confirmSaleAction, type CartItem } from "@/lib/actions/sales"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"

interface Product {
  id: string
  name: string
  sku: string | null
  sale_price: number
  cost_price: number
  stock_quantity: number
  unit: string
}
interface Customer { id: string; name: string; phone: string | null }
interface PaymentMethod { id: string; name: string; type: string }

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export function PdvClient({
  products,
  customers,
  paymentMethods,
}: {
  products: Product[]
  customers: Customer[]
  paymentMethods: PaymentMethod[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [customerId, setCustomerId] = useState<string>("none")
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.type ?? "dinheiro")
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState("")

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
      if (existing.quantity >= product.stock_quantity) {
        toast.error("Estoque insuficiente")
        return
      }
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sale_price,
        costPrice: product.cost_price,
        discount: 0,
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

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0)
  const total = Math.max(0, subtotal - discount)

  function handleConfirm() {
    if (cart.length === 0) { toast.error("Adicione pelo menos um produto"); return }
    if (!paymentMethod) { toast.error("Selecione a forma de pagamento"); return }

    startTransition(async () => {
      const result = await confirmSaleAction(cart, customerId === "none" ? null : customerId, discount, paymentMethod, notes)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success ?? "Venda registrada!")
      if (result.saleId) router.push(`/vendas/${result.saleId}`)
    })
  }

  return (
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
                  <div key={item.productId} className="flex items-center gap-3 p-3 rounded-lg border">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Cliente (opcional)</CardTitle></CardHeader>
          <CardContent>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.length > 0
                    ? paymentMethods.map(m => <SelectItem key={m.id} value={m.type}>{m.name}</SelectItem>)
                    : Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount">Desconto global (R$)</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                step="0.01"
                value={discount || ""}
                onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0,00"
              />
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
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto</span>
                <span>−{fmt(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-emerald-600">{fmt(total)}</span>
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
  )
}
