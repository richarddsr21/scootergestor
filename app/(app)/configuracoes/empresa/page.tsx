import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { EmpresaForm } from "./empresa-form"

export default async function EmpresaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single()
  if (!profile) redirect("/onboarding")

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
