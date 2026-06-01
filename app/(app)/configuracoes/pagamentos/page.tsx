import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PagamentosClient } from "./pagamentos-client"

export default async function PagamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const { data: metodos } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formas de pagamento"
        description="Ative ou desative as formas de pagamento aceitas pela empresa."
      />
      <PagamentosClient metodos={metodos ?? []} />
    </div>
  )
}
