"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveWarrantyAction } from "@/lib/actions/warranties"
import { WARRANTY_TYPES } from "@/lib/constants"

const WARRANTY_TYPE_LABELS: Record<string, string> = {
  produto: "Produto",
  servico: "Serviço",
  bateria: "Bateria",
  carregador: "Carregador",
  scooter: "Scooter",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  expired: "Expirada",
  claimed: "Acionada",
}

interface Customer { id: string; name: string }
interface Vehicle { id: string; brand: string | null; model: string | null; type: string }
interface Product { id: string; name: string }

interface Props {
  customers: Customer[]
  products?: Product[]
  warranty?: {
    id: string
    customer_id: string
    warranty_type: string
    start_date: string
    end_date: string
    status: string
    product_id: string | null
    vehicle_id: string | null
    service_order_id: string | null
    notes: string | null
  }
  vehicles?: Vehicle[]
}

const INIT = { error: undefined, success: undefined }

export function WarrantyForm({ customers, products = [], warranty, vehicles = [] }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveWarrantyAction, INIT)

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if (!warranty && (state as any).id) {
        router.push(`/garantias/${(state as any).id}`)
      } else if (warranty) {
        router.push(`/garantias/${warranty.id}`)
      }
    }
    if (state.error) toast.error(state.error)
  }, [state])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {warranty && <input type="hidden" name="id" value={warranty.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="customer_id">Cliente *</Label>
          <Select name="customer_id" defaultValue={warranty?.customer_id ?? ""} required>
            <SelectTrigger id="customer_id">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="warranty_type">Tipo de garantia *</Label>
          <Select name="warranty_type" defaultValue={warranty?.warranty_type ?? "servico"}>
            <SelectTrigger id="warranty_type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WARRANTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{WARRANTY_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={warranty?.status ?? "active"}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="start_date">Data de início *</Label>
          <Input id="start_date" name="start_date" type="date" required defaultValue={warranty?.start_date ?? today} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_date">Data de término *</Label>
          <Input id="end_date" name="end_date" type="date" required defaultValue={warranty?.end_date ?? ""} />
        </div>

        {products.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="product_id">Produto (opcional)</Label>
            <Select name="product_id" defaultValue={warranty?.product_id ?? "none"}>
              <SelectTrigger id="product_id"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {vehicles.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="vehicle_id">Veículo (opcional)</Label>
            <Select name="vehicle_id" defaultValue={warranty?.vehicle_id ?? "none"}>
              <SelectTrigger id="vehicle_id"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {[v.brand, v.model].filter(Boolean).join(" ") || v.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" defaultValue={warranty?.notes ?? ""} rows={3} placeholder="Detalhes sobre a garantia..." />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : warranty ? "Atualizar garantia" : "Criar garantia"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
