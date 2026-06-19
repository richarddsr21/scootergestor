import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PdvClient } from "@/components/sales/pdv-client"
import { getOpenCashRegisterAction } from "@/lib/actions/cash"

export default async function NovaVendaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const [{ data: products }, { data: customers }, { data: paymentMethods }, register] = await Promise.all([
    supabase.from("products")
      .select("id, name, sku, sale_price, cost_price, stock_quantity, unit, product_type, requires_chassis")
      .eq("company_id", cid).eq("status", "active")
      .gt("stock_quantity", 0)
      .order("name"),
    supabase.from("customers")
      .select("id, name, phone")
      .eq("company_id", cid)
      .order("name"),
    supabase.from("payment_methods")
      .select("id, name, type, fee_percent, installment_fees")
      .eq("company_id", cid).eq("active", true)
      .order("name"),
    getOpenCashRegisterAction(),
  ])

  return (
    <div className="space-y-4">
      <PageHeader title="PDV — Nova venda" description="Registre uma nova venda." />
      <PdvClient
        products={products ?? []}
        customers={customers ?? []}
        paymentMethods={(paymentMethods ?? []) as any}
        caixaAberto={!!register}
      />
    </div>
  )
}
