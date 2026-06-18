"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { saveProductAction } from "@/lib/actions/products"
import { PRODUCT_TYPE_LABELS } from "@/lib/constants"
import type { Tables } from "@/types/database"

interface Category {
  id: string
  name: string
}

interface Props {
  product?: Tables<"products">
  categories: Category[]
}

const INIT = { error: undefined, success: undefined }

export function ProductForm({ product, categories }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveProductAction, INIT)

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if (!product && (state as any).id) router.push(`/produtos/${(state as any).id}`)
      else if (product) router.push(`/produtos/${product.id}`)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" name="name" required defaultValue={product?.name ?? ""} placeholder="Nome do produto" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product_type">Tipo *</Label>
          <Select name="product_type" defaultValue={product?.product_type ?? "other"}>
            <SelectTrigger id="product_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category_id">Categoria</Label>
          <Select name="category_id" defaultValue={product?.category_id ?? "none"}>
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} placeholder="SKU-001" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} placeholder="Marca" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" defaultValue={product?.model ?? ""} placeholder="Modelo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unidade *</Label>
          <Input id="unit" name="unit" defaultValue={product?.unit ?? "un"} placeholder="un, kg, m..." />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cost_price">Preço de custo (R$)</Label>
          <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0"
            defaultValue={product?.cost_price ?? 0} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sale_price">Preço de venda (R$) *</Label>
          <Input id="sale_price" name="sale_price" type="number" step="0.01" min="0"
            defaultValue={product?.sale_price ?? 0} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock_quantity">Estoque atual</Label>
          <Input id="stock_quantity" name="stock_quantity" type="number" min="0"
            defaultValue={product?.stock_quantity ?? 0} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minimum_stock">Estoque mínimo</Label>
          <Input id="minimum_stock" name="minimum_stock" type="number" min="0"
            defaultValue={product?.minimum_stock ?? 0} />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={3}
            placeholder="Descrição do produto..." />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <Checkbox
            id="requires_chassis"
            name="requires_chassis"
            value="true"
            defaultChecked={product?.requires_chassis ?? false}
          />
          <Label htmlFor="requires_chassis" className="cursor-pointer font-normal">
            Exigir número de chassi na venda (ex: scooters)
          </Label>
        </div>

        {product && (
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={product.status ?? "active"}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : product ? "Atualizar produto" : "Criar produto"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
