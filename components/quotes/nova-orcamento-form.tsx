"use client"

import { useActionState, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createQuoteAction } from "@/lib/actions/quotes"
import { QuickCustomerDialog } from "@/components/customers/quick-customer-dialog"

interface Customer { id: string; name: string }
interface Product { id: string; name: string; sale_price: number }

interface Props {
  customers: Customer[]
  products: Product[]
}

interface LineItem {
  key: number
  item_type: "part" | "service" | "labor"
  product_id: string
  description: string
  quantity: number
  unit_price: number
}

const TYPES = { part: "Peça", service: "Serviço", labor: "Mão de obra" } as const
const INIT = { error: undefined, success: undefined }

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

let nextKey = 0

function emptyItem(): LineItem {
  return { key: nextKey++, item_type: "part", product_id: "", description: "", quantity: 1, unit_price: 0 }
}

export function NovaOrcamentoForm({ customers: initialCustomers, products }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createQuoteAction, INIT)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [customerId, setCustomerId] = useState("")

  function handleCustomerCreated(customer: Customer) {
    setCustomers(prev => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)))
    setCustomerId(customer.id)
  }
  const [discount, setDiscount] = useState(0)
  const [items, setItems] = useState<LineItem[]>([emptyItem()])

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if ((state as any).id) router.push(`/oficina/orcamentos/${(state as any).id}`)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  const updateItem = useCallback((key: number, patch: Partial<LineItem>) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i))
  }, [])

  function handleProductSelect(key: number, productId: string) {
    const product = products.find(p => p.id === productId)
    updateItem(key, {
      product_id: productId,
      description: product?.name ?? "",
      unit_price: product?.sale_price ?? 0,
    })
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(key: number) {
    setItems(prev => prev.length === 1 ? prev : prev.filter(i => i.key !== key))
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const total = Math.max(0, subtotal - discount)
  const hasItems = items.some(i => i.description.trim() !== "")
  const canSubmit = customerId && hasItems

  return (
    <form action={action} className="space-y-6 max-w-4xl">
      {/* Serialized items for the server action */}
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="items" value={JSON.stringify(
        items
          .filter(i => i.description.trim() !== "")
          .map(({ key: _k, ...i }) => ({ ...i, total: i.quantity * i.unit_price }))
      )} />
      <input type="hidden" name="discount" value={discount} />

      {/* Header fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customer_sel">Cliente *</Label>
          <div className="flex gap-2">
            <Select value={customerId} onValueChange={setCustomerId} required>
              <SelectTrigger id="customer_sel" className="flex-1">
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickCustomerDialog onCreated={handleCustomerCreated} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valid_until">Válido até</Label>
          <Input id="valid_until" name="valid_until" type="date" />
        </div>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Itens do orçamento</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar linha
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[120px_1fr_1fr_80px_110px_32px] gap-2 px-1 text-xs text-muted-foreground font-medium">
            <span>Tipo</span>
            <span>Produto (opcional)</span>
            <span>Descrição *</span>
            <span>Qtd</span>
            <span className="text-right">Preço unit.</span>
            <span />
          </div>

          {items.map(item => (
            <div key={item.key} className="grid gap-2 sm:grid-cols-[120px_1fr_1fr_80px_110px_32px] items-center">
              {/* Tipo */}
              <Select
                value={item.item_type}
                onValueChange={v => updateItem(item.key, { item_type: v as LineItem["item_type"] })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Produto */}
              <Select
                value={item.product_id || "none"}
                onValueChange={v => handleProductSelect(item.key, v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Manual..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Manual</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({fmt(p.sale_price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Descrição */}
              <Input
                className="h-9 text-sm"
                placeholder="Descrição..."
                value={item.description}
                onChange={e => updateItem(item.key, { description: e.target.value })}
              />

              {/* Quantidade */}
              <Input
                className="h-9 text-sm"
                type="number"
                min="0.001"
                step="0.001"
                value={item.quantity}
                onChange={e => updateItem(item.key, { quantity: Math.max(0.001, Number(e.target.value)) })}
              />

              {/* Preço unitário */}
              <Input
                className="h-9 text-sm text-right"
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={e => updateItem(item.key, { unit_price: Math.max(0, Number(e.target.value)) })}
              />

              {/* Remover */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-red-600 shrink-0"
                onClick={() => removeItem(item.key)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {/* Totais */}
          <div className="pt-3 space-y-1.5">
            <Separator />
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <Label htmlFor="discount_input" className="text-muted-foreground shrink-0">Desconto (R$)</Label>
              <Input
                id="discount_input"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                className="h-8 w-36 text-right text-sm"
              />
            </div>

            <Separator />
            <div className="flex items-center justify-between text-base font-bold pt-0.5">
              <span>Total</span>
              <span className="text-emerald-600">{fmt(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Condições, prazo, termos ou observações para o cliente..."
          rows={3}
        />
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending ? "Criando..." : "Criar orçamento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
