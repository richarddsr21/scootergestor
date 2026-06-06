import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { CustomerForm } from "@/components/customers/customer-form"

export default async function NovoClientePage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  return (
    <div className="space-y-6">
      <PageHeader title="Novo cliente" description="Cadastre um novo cliente." />
      <CustomerForm />
    </div>
  )
}
