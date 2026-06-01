import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { MensagensClient } from "./mensagens-client"

export default async function MensagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

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
