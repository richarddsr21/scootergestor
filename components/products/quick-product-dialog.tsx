"use client"

import { useState, useTransition } from "react"
import { PackagePlus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { quickCreateProductAction } from "@/lib/actions/products"

interface Props {
  onCreated: (product: {
    id: string
    name: string
    sku: string | null
    sale_price: number
    cost_price: number
    stock_quantity: number
    unit: string
    product_type: string
    requires_chassis: boolean
  }) => void
  triggerSize?: "sm" | "default"
}

export function QuickProductDialog({ onCreated, triggerSize = "sm" }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("1")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const sale_price = parseFloat(salePrice.replace(",", ".")) || 0
      const stock_quantity = parseInt(stockQuantity, 10) || 0
      const result = await quickCreateProductAction({ name, sale_price, stock_quantity })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Produto cadastrado")
        onCreated({
          id: result.id!,
          name: name.trim(),
          sku: null,
          sale_price,
          cost_price: 0,
          stock_quantity,
          unit: "un",
          product_type: "other",
          requires_chassis: false,
        })
        setOpen(false)
        setName("")
        setSalePrice("")
        setStockQuantity("1")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size={triggerSize} className="shrink-0">
          <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
          Novo produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cadastro rápido de produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="qp_name">Nome *</Label>
            <Input
              id="qp_name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Nome do produto"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qp_price">Preço de venda (R$)</Label>
            <Input
              id="qp_price"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qp_stock">Estoque inicial</Label>
            <Input
              id="qp_stock"
              value={stockQuantity}
              onChange={e => setStockQuantity(e.target.value)}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Salvando..." : "Cadastrar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
