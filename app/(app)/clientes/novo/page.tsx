import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { CustomerForm } from "@/components/customers/customer-form"

export default async function NovoClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  return (
    <div className="space-y-6">
      <PageHeader title="Novo cliente" description="Cadastre um novo cliente." />
      <CustomerForm />
    </div>
  )
}
