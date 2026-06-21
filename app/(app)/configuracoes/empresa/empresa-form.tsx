"use client"

import { useActionState } from "react"
import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { updateCompanyInfoAction } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"
import { CpfCnpjField } from "@/components/ui/cpf-cnpj-field"

interface Props {
  company: Tables<"companies"> | null
  settings: Tables<"company_settings"> | null
}

export function EmpresaForm({ company, settings }: Props) {
  const [state, formAction, pending] = useActionState(updateCompanyInfoAction, {})

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) toast.success(state.success)
  }, [state])

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Informações básicas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa *</Label>
            <Input id="name" name="name" defaultValue={company?.name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_name">Nome fantasia</Label>
            <Input id="business_name" name="business_name" defaultValue={settings?.business_name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_name">Razão social</Label>
            <Input id="legal_name" name="legal_name" defaultValue={settings?.legal_name ?? ""} />
          </div>
          <CpfCnpjField name="cnpj" defaultValue={settings?.cnpj ?? ""} className="space-y-2" />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Contato</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" placeholder="(21) 0000-0000" defaultValue={settings?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" placeholder="(21) 90000-0000" defaultValue={settings?.whatsapp ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="contato@empresa.com" defaultValue={settings?.email ?? ""} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Endereço</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" placeholder="Rua, número, complemento" defaultValue={settings?.address ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" defaultValue={settings?.city ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" name="state" placeholder="RJ" maxLength={2} defaultValue={settings?.state ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP</Label>
            <Input id="zip_code" name="zip_code" placeholder="00000-000" defaultValue={settings?.zip_code ?? ""} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Outros</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business_hours">Horário de funcionamento</Label>
            <Input id="business_hours" name="business_hours" placeholder="Seg–Sex 9h–18h, Sáb 9h–13h" defaultValue={settings?.business_hours ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan</Label>
            <Input id="slogan" name="slogan" placeholder="Especialistas em scooters elétricas" defaultValue={settings?.slogan ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações internas</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={settings?.notes ?? ""} />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  )
}
