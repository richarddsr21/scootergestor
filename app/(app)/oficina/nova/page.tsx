import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { NovaOsForm } from "@/components/service-orders/nova-os-form"

export default async function NovaOsPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>
}) {
  const { cliente } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id

  const [{ data: customers }, { data: technicians }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("company_id", cid).order("name"),
    supabase.from("profiles")
      .select("id, name")
      .eq("company_id", cid)
      .eq("status", "active")
      .in("role", ["technician", "admin", "owner", "manager"])
      .order("name"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Nova OS" description="Abra uma nova ordem de serviço." />
      <NovaOsForm
        customers={customers ?? []}
        technicians={technicians ?? []}
        defaultCustomerId={cliente}
      />
    </div>
  )
}
