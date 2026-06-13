"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createServiceOrderAction } from "@/lib/actions/service-orders"
import { OS_PRIORITY_LABELS } from "@/lib/constants"

interface Props {
  customers: { id: string; name: string }[]
  technicians: { id: string; name: string }[]
  defaultCustomerId?: string
}

const INIT = { error: undefined, success: undefined }

export function NovaOsForm({ customers, technicians, defaultCustomerId }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createServiceOrderAction, INIT)

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if ((state as any).id) router.push(`/oficina/${(state as any).id}`)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customer_id">Cliente *</Label>
          <Select name="customer_id" defaultValue={defaultCustomerId ?? undefined} required>
            <SelectTrigger id="customer_id"><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioridade</Label>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(OS_PRIORITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="technician_id">Técnico responsável</Label>
          <Select name="technician_id" defaultValue="none">
            <SelectTrigger id="technician_id"><SelectValue placeholder="Não atribuído" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não atribuído</SelectItem>
              {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expected_delivery_at">Previsão de entrega</Label>
          <Input id="expected_delivery_at" name="expected_delivery_at" type="date" />
        </div>

        <div className="sm:col-span-2 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Dados da scooter</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_brand">Marca</Label>
              <Input id="vehicle_brand" name="vehicle_brand" placeholder="Ex: Garelli, Xiaomi, Voltz..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_model">Modelo</Label>
              <Input id="vehicle_model" name="vehicle_model" placeholder="Ex: X11, X13, STREET..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_chassis">Nº de chassi</Label>
              <Input id="vehicle_chassis" name="vehicle_chassis" placeholder="Ex: 9C2JC30..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mileage_km">Quilometragem</Label>
              <Input id="mileage_km" name="mileage_km" type="number" min="0" placeholder="Ex: 1250" />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="reported_problem">Problema relatado *</Label>
          <Textarea
            id="reported_problem"
            name="reported_problem"
            required
            rows={4}
            placeholder="Descreva o problema relatado pelo cliente..."
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="internal_notes">Notas internas (opcional)</Label>
          <Textarea
            id="internal_notes"
            name="internal_notes"
            rows={2}
            placeholder="Informações internas para a equipe..."
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Criando OS..." : "Abrir OS"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
