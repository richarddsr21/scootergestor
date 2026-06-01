import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { WarrantyForm } from "@/components/warranties/warranty-form"

export default async function NovaGarantiaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("company_id", cid).order("name"),
    supabase.from("products").select("id, name").eq("company_id", cid).eq("status", "active").order("name"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Nova garantia" description="Registre uma garantia para produto ou serviço." />
      <WarrantyForm customers={customers ?? []} products={products ?? []} />
    </div>
  )
}
