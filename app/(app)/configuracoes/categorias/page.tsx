import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { CategoriasClient } from "./categorias-client"

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const { data: categorias } = await supabase
    .from("product_categories")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("type")
    .order("display_order")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de produto"
        description="Organize seus produtos e serviços por categoria."
      />
      <CategoriasClient categorias={categorias ?? []} />
    </div>
  )
}
