import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single()

  if (!supplier) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title="Editar fornecedor" description={supplier.name} />
      <SupplierForm supplier={supplier} />
    </div>
  )
}
