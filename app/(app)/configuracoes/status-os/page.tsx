import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { StatusOsClient } from "./status-os-client"

export default async function StatusOsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const { data: statuses } = await supabase
    .from("service_order_statuses")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("display_order")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status de OS"
        description="Controle as etapas do fluxo de uma Ordem de Serviço."
      />
      <StatusOsClient statuses={statuses ?? []} />
    </div>
  )
}
