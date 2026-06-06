import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { AparenciaForm } from "./aparencia-form"

export default async function AparenciaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: theme } = await supabase
    .from("company_theme_settings")
    .select("*")
    .eq("company_id", profile.company_id)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aparência"
        description="Personalize as cores e o nome do sistema para sua empresa."
      />
      <AparenciaForm theme={theme} />
    </div>
  )
}
