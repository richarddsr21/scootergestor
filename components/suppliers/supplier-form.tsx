"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveSupplierAction } from "@/lib/actions/suppliers"
import { CpfCnpjField } from "@/components/ui/cpf-cnpj-field"

interface Props {
  supplier?: {
    id: string
    name: string
    cnpj: string | null
    phone: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    notes: string | null
  }
}

const INIT = { error: undefined, success: undefined }

export function SupplierForm({ supplier }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveSupplierAction, INIT)

  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      if (!supplier && (state as any).id) {
        router.push(`/fornecedores/${(state as any).id}`)
      } else if (supplier) {
        router.push(`/fornecedores/${supplier.id}`)
      }
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {supplier && <input type="hidden" name="id" value={supplier.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="name">Nome / Razão social *</Label>
          <Input id="name" name="name" required defaultValue={supplier?.name ?? ""} placeholder="Nome do fornecedor" />
        </div>
        <CpfCnpjField name="cnpj" defaultValue={supplier?.cnpj ?? ""} />
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ""} placeholder="contato@fornecedor.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} placeholder="(11) 3000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={supplier?.whatsapp ?? ""} placeholder="(11) 99999-9999" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" name="address" defaultValue={supplier?.address ?? ""} placeholder="Rua, número, cidade, estado" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" defaultValue={supplier?.notes ?? ""} rows={3} placeholder="Condições de pagamento, prazo de entrega..." />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : supplier ? "Atualizar fornecedor" : "Criar fornecedor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
