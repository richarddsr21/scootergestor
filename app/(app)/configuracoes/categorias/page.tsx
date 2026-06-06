import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { CategoriasClient } from "./categorias-client"

export default async function CategoriasPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

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
