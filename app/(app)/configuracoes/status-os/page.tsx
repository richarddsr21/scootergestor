import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { StatusOsClient } from "./status-os-client"

export default async function StatusOsPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

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
