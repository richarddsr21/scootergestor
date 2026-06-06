import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ServicosClient } from "./servicos-client"

export default async function ServicosPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: servicos } = await supabase
    .from("services")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("status", "active")
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Serviços padrão usados nas Ordens de Serviço."
      />
      <ServicosClient servicos={servicos ?? []} />
    </div>
  )
}
