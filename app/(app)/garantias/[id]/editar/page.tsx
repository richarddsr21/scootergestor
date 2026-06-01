import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { WarrantyForm } from "@/components/warranties/warranty-form"

export default async function EditarGarantiaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id

  const { data: warranty } = await supabase
    .from("warranties").select("*").eq("id", id).eq("company_id", cid).single()

  if (!warranty) notFound()

  const [{ data: customers }, { data: products }, { data: vehicles }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("company_id", cid).order("name"),
    supabase.from("products").select("id, name").eq("company_id", cid).eq("status", "active").order("name"),
    supabase.from("vehicles").select("id, brand, model, type").eq("customer_id", warranty.customer_id).eq("company_id", cid),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Editar garantia" description="Atualize os dados da garantia." />
      <WarrantyForm
        warranty={warranty}
        customers={customers ?? []}
        products={products ?? []}
        vehicles={(vehicles as any) ?? []}
      />
    </div>
  )
}
