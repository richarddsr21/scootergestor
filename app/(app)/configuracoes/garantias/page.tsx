import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { GarantiasClient } from "./garantias-client"

export default async function GarantiasPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: regras } = await supabase
    .from("warranty_rules")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("status", "active")
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regras de garantia"
        description="Prazos de garantia padrão por tipo de produto ou serviço."
      />
      <GarantiasClient regras={regras ?? []} />
    </div>
  )
}
