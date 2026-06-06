import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default async function NovoFornecedorPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  return (
    <div className="space-y-6">
      <PageHeader title="Novo fornecedor" description="Cadastre um novo fornecedor." />
      <SupplierForm />
    </div>
  )
}
