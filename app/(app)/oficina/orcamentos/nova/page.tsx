import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { NovaOrcamentoForm } from "@/components/quotes/nova-orcamento-form"

export default async function NovaOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ os_id?: string }>
}) {
  const { os_id } = await searchParams
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const [{ data: orders }, { data: customers }] = await Promise.all([
    supabase.from("service_orders")
      .select("id, order_number, customer_id, customers(name)")
      .eq("company_id", cid)
      .is("delivered_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("customers")
      .select("id, name")
      .eq("company_id", cid)
      .order("name"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Orçamento" description="Gere um orçamento para uma OS." />
      <NovaOrcamentoForm
        orders={(orders as any[]) ?? []}
        customers={customers ?? []}
        defaultOsId={os_id}
      />
    </div>
  )
}
