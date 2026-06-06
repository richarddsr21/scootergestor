import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ChecklistClient } from "./checklist-client"

export default async function ChecklistPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  // Get the default template
  const { data: template } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("is_default", true)
    .maybeSingle()

  const { data: items } = template
    ? await supabase
        .from("checklist_template_items")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("template_id", template.id)
        .order("display_order")
    : { data: [] }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist de entrada"
        description="Itens verificados no recebimento de cada scooter na oficina."
      />
      <ChecklistClient
        items={items ?? []}
        templateId={template?.id ?? null}
      />
    </div>
  )
}
