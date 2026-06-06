import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/products/product-form"

export default async function NovoProdutoPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("product_categories").select("id, name")
    .eq("company_id", profile.company_id).order("name")

  return (
    <div className="space-y-6">
      <PageHeader title="Novo produto" description="Cadastre um novo produto no catálogo." />
      <ProductForm categories={categories ?? []} />
    </div>
  )
}
