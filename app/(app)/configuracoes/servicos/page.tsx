import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ServicosClient } from "./servicos-client"

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

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
