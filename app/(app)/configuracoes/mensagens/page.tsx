import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { MensagensClient } from "./mensagens-client"

export default async function MensagensPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from("message_templates")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens WhatsApp"
        description="Modelos de mensagem enviados automaticamente ou manualmente via WhatsApp."
      />
      <MensagensClient templates={templates ?? []} />
    </div>
  )
}
