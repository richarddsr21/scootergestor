import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { EmpresaForm } from "./empresa-form"

export default async function EmpresaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const [{ data: company }, { data: settings }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", profile.company_id).single(),
    supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", profile.company_id)
      .maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dados da empresa"
        description="Informações que aparecem em orçamentos, OS e mensagens."
      />
      <EmpresaForm company={company} settings={settings} />
    </div>
  )
}
