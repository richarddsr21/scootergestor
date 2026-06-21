"use client"

import { useActionState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveCustomerAction } from "@/lib/actions/customers"
import { CpfCnpjField } from "@/components/ui/cpf-cnpj-field"

interface Props {
  customer?: {
    id: string
    name: string
    phone: string | null
    whatsapp: string | null
    email: string | null
    cpf_cnpj: string | null
    address: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    notes: string | null
  }
}

const INIT = { error: undefined, success: undefined }

export function CustomerForm({ customer }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveCustomerAction, INIT)
  const formKey = useRef(0)

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if (!customer && (state as any).id) {
        router.push(`/clientes/${(state as any).id}`)
      } else if (customer) {
        router.push(`/clientes/${customer.id}`)
      }
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form key={formKey.current} action={action} className="space-y-6 max-w-2xl">
      {customer && <input type="hidden" name="id" value={customer.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" name="name" required defaultValue={customer?.name ?? ""} placeholder="Nome completo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={customer?.whatsapp ?? ""} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} placeholder="email@exemplo.com" />
        </div>
        <CpfCnpjField name="cpf_cnpj" defaultValue={customer?.cpf_cnpj ?? ""} />
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" name="address" defaultValue={customer?.address ?? ""} placeholder="Rua, número, bairro" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" defaultValue={customer?.city ?? ""} placeholder="São Paulo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" name="state" maxLength={2} defaultValue={customer?.state ?? ""} placeholder="SP" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zip_code">CEP</Label>
          <Input id="zip_code" name="zip_code" defaultValue={customer?.zip_code ?? ""} placeholder="00000-000" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} rows={3} placeholder="Observações sobre o cliente..." />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : customer ? "Atualizar cliente" : "Criar cliente"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
