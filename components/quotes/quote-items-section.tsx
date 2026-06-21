"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { addQuoteItemAction, deleteQuoteItemAction } from "@/lib/actions/quotes"

interface Item {
  id: string
  item_type: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Product {
  id: string
  name: string
  sale_price: number
}

interface Props {
  quoteId: string
  items: Item[]
  products: Product[]
  readonly?: boolean
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  scooter: "Scooter",
  part: "Peça",
  service: "Serviço",
  labor: "Mão de obra",
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

const INIT = { error: undefined, success: undefined }

export function QuoteItemsSection({ quoteId, items, products, readonly }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [state, action, pending] = useActionState(addQuoteItemAction, INIT)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      setShowForm(false)
      setSelectedProduct("")
    }
    if (state.error) toast.error(state.error)
  }, [state])

  async function handleDelete(id: string) {
    setDeleting(id)
    setRemovedIds(prev => new Set([...prev, id]))

    const result = await deleteQuoteItemAction(id, quoteId)
    if (result.error) {
      toast.error(result.error)
      setRemovedIds(prev => { const next = new Set(prev); next.delete(id); return next })
    } else {
      toast.success(result.success ?? "Removido")
      router.refresh()
    }
    setDeleting(null)
  }

  function handleProductSelect(productId: string) {
    setSelectedProduct(productId)
  }

  const visibleItems = items.filter(i => !removedIds.has(i.id))
  const total = visibleItems.reduce((s, i) => s + i.total, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Itens do orçamento</CardTitle>
        {!readonly && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && !readonly && (
          <form action={action} className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <input type="hidden" name="quote_id" value={quoteId} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select name="item_type" defaultValue="part">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Produto (opcional)</Label>
                <Select name="product_id" value={selectedProduct} onValueChange={v => handleProductSelect(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Produto do estoque..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Manual (sem vínculo)</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Descrição *</Label>
                <Input
                  name="description"
                  required
                  defaultValue={selectedProduct ? products.find(p => p.id === selectedProduct)?.name ?? "" : ""}
                  placeholder="Descreva o item ou serviço"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quantidade</Label>
                <Input name="quantity" type="number" step="0.001" min="0.001" defaultValue="1" required />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Preço unitário (R$)</Label>
                <Input
                  name="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={selectedProduct ? String(products.find(p => p.id === selectedProduct)?.sale_price ?? "0") : "0"}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Salvando..." : "Adicionar item"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {visibleItems.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado.</p>
        )}

        {visibleItems.length > 0 && (
          <div className="space-y-1">
            {visibleItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 text-sm">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}</span>
                <span className="flex-1 truncate">{item.description}</span>
                <span className="text-muted-foreground text-xs shrink-0">{item.quantity} × {fmt(item.unit_price)}</span>
                <span className="font-medium shrink-0 w-24 text-right">{fmt(item.total)}</span>
                {!readonly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
                    disabled={deleting === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between px-2 font-semibold text-sm">
              <span>Total</span>
              <span className="text-emerald-600">{fmt(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
