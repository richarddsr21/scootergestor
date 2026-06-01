import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PdvClient } from "@/components/sales/pdv-client"

export default async function NovaVendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id

  const [{ data: products }, { data: customers }, { data: paymentMethods }] = await Promise.all([
    supabase.from("products")
      .select("id, name, sku, sale_price, cost_price, stock_quantity, unit")
      .eq("company_id", cid).eq("status", "active")
      .gt("stock_quantity", 0)
      .order("name"),
    supabase.from("customers")
      .select("id, name, phone")
      .eq("company_id", cid)
      .order("name"),
    supabase.from("payment_methods")
      .select("id, name, type")
      .eq("company_id", cid).eq("active", true)
      .order("name"),
  ])

  return (
    <div className="space-y-4">
      <PageHeader title="PDV — Nova venda" description="Registre uma nova venda." />
      <PdvClient
        products={products ?? []}
        customers={customers ?? []}
        paymentMethods={paymentMethods ?? []}
      />
    </div>
  )
}
