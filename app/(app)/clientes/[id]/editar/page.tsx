import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { CustomerForm } from "@/components/customers/customer-form"

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single()

  if (!customer) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title="Editar cliente" description={customer.name} />
      <CustomerForm customer={customer} />
    </div>
  )
}
