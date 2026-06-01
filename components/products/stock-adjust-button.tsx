"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpDown } from "lucide-react"
import { adjustStockAction } from "@/lib/actions/stock"

const INIT = { error: undefined, success: undefined }

export function StockAdjustButton({
  productId,
  productName,
  currentStock,
}: {
  productId: string
  productName: string
  currentStock: number
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(adjustStockAction, INIT)

  useEffect(() => {
    if (state.success) { toast.success(state.success); setOpen(false) }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ArrowUpDown className="mr-1 h-4 w-4" />Ajustar estoque
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <input type="hidden" name="product_id" value={productId} />
            <p className="text-sm text-muted-foreground">
              <strong>{productName}</strong> — Estoque atual: <strong>{currentStock}</strong>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Quantidade (use negativo para saída)</Label>
              <Input id="qty" name="quantity" type="number" required placeholder="+10 ou -5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observação</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="Motivo do ajuste..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Confirmar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
