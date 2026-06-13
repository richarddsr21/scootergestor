"use client"

import { useState, useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { saveOsItemAction, deleteOsItemAction } from "@/lib/actions/service-orders"

interface OsItem {
  id: string
  item_type: string
  description: string
  quantity: number
  unit_price: number
  cost_price: number
  total: number
  product_id: string | null
}
interface Product {
  id: string
  name: string
  sale_price: number
  cost_price: number
  stock_quantity: number
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

const INIT = { error: undefined, success: undefined }
const TYPE_LABELS = { part: "Peça", service: "Serviço", labor: "Mão de obra" }

function ItemForm({ item, osId, products, onClose }: {
  item?: OsItem
  osId: string
  products: Product[]
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(saveOsItemAction, INIT)
  const [selectedProduct, setSelectedProduct] = useState(item?.product_id ?? "")
  const [unitPrice, setUnitPrice] = useState(item?.unit_price ?? 0)

  useEffect(() => {
    if (state.success) { toast.success(state.success); onClose() }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  function handleProductSelect(productId: string) {
    const realId = productId === "none" ? "" : productId
    setSelectedProduct(realId)
    const p = products.find(p => p.id === realId)
    if (p) setUnitPrice(p.sale_price)
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="service_order_id" value={osId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="product_id" value={selectedProduct} />
      <input type="hidden" name="cost_price" value={selectedProduct ? (products.find(p => p.id === selectedProduct)?.cost_price ?? 0) : 0} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select name="item_type" defaultValue={item?.item_type ?? "part"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Produto (opcional)</Label>
          <Select value={selectedProduct || "none"} onValueChange={handleProductSelect}>
            <SelectTrigger><SelectValue placeholder="Selecionar produto..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({fmt(p.sale_price)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label>Descrição *</Label>
          <Input name="description" required defaultValue={item?.description ?? ""} placeholder="Descrição do item..." />
        </div>

        <div className="space-y-1.5">
          <Label>Quantidade</Label>
          <Input name="quantity" type="number" min="0.01" step="0.01" defaultValue={item?.quantity ?? 1} />
        </div>

        <div className="space-y-1.5">
          <Label>Preço unitário (R$)</Label>
          <Input
            name="unit_price"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={e => setUnitPrice(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : item ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  )
}

export function OsItemsSection({ osId, items, products }: {
  osId: string
  items: OsItem[]
  products: Product[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OsItem | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const visibleItems = items.filter(i => !removedIds.has(i.id))
  const subtotal = visibleItems.reduce((s, i) => s + i.total, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Peças e serviços</CardTitle>
        <Button size="sm" variant="outline" onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="mr-1 h-3 w-3" />Adicionar
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {visibleItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum item adicionado.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Descrição</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Tipo</th>
                  <th className="text-right p-3 font-medium">Qtd</th>
                  <th className="text-right p-3 font-medium">Unit.</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleItems.map(item => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-right hidden sm:table-cell text-muted-foreground text-xs">
                      {TYPE_LABELS[item.item_type as keyof typeof TYPE_LABELS] ?? item.item_type}
                    </td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">{fmt(item.unit_price)}</td>
                    <td className="p-3 text-right font-medium">{fmt(item.total)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(item); setOpen(true) }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover item?</AlertDialogTitle>
                              <AlertDialogDescription>Os totais da OS serão recalculados.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => {
                                setRemovedIds(prev => new Set([...prev, item.id]))
                                const r = await deleteOsItemAction(item.id, osId)
                                if (r.error) {
                                  toast.error(r.error)
                                  setRemovedIds(prev => { const next = new Set(prev); next.delete(item.id); return next })
                                } else {
                                  toast.success(r.success ?? "Removido")
                                  router.refresh()
                                }
                              }}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td colSpan={4} className="p-3 text-right font-medium text-sm">Subtotal</td>
                  <td className="p-3 text-right font-bold">{fmt(subtotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar item" : "Adicionar item"}</DialogTitle>
          </DialogHeader>
          <ItemForm item={editing ?? undefined} osId={osId} products={products} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
