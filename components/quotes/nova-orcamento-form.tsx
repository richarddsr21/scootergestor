"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createQuoteAction } from "@/lib/actions/quotes"

interface Order {
  id: string
  order_number: string
  customer_id: string
  customers: { name: string } | null
}

interface Customer {
  id: string
  name: string
}

interface Props {
  orders: Order[]
  customers: Customer[]
  defaultOsId?: string
}

const INIT = { error: undefined, success: undefined }

export function NovaOrcamentoForm({ orders, customers, defaultOsId }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createQuoteAction, INIT)
  const [selectedOs, setSelectedOs] = useState(defaultOsId ?? "")
  const [customerId, setCustomerId] = useState("")

  // Auto-fill customer when OS is selected
  useEffect(() => {
    if (selectedOs) {
      const os = orders.find(o => o.id === selectedOs)
      if (os) setCustomerId(os.customer_id)
    }
  }, [selectedOs, orders])

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if ((state as any).id) router.push(`/oficina/orcamentos/${(state as any).id}?autoSend=1`)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  const selectedOsData = orders.find(o => o.id === selectedOs)

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <input type="hidden" name="customer_id" value={customerId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="service_order_id">Ordem de Serviço *</Label>
          <Select
            name="service_order_id"
            value={selectedOs}
            onValueChange={setSelectedOs}
            required
          >
            <SelectTrigger id="service_order_id">
              <SelectValue placeholder="Selecionar OS..." />
            </SelectTrigger>
            <SelectContent>
              {orders.map(os => (
                <SelectItem key={os.id} value={os.id}>
                  {os.order_number} — {os.customers?.name ?? "Cliente"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOsData && (
            <p className="text-xs text-muted-foreground">
              Cliente: {selectedOsData.customers?.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valid_until">Válido até</Label>
          <Input id="valid_until" name="valid_until" type="date" />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Condições, termos, observações para o cliente..."
            rows={3}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Os itens da OS serão copiados automaticamente. Você poderá editar após criar o orçamento.
      </p>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !selectedOs}>
          {pending ? "Criando..." : "Criar orçamento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
