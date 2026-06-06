import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/products/product-form"

export default async function EditarProdutoPage({
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

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("company_id", profile.company_id).single(),
    supabase.from("product_categories").select("id, name").eq("company_id", profile.company_id).order("name"),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title="Editar produto" description={product.name} />
      <ProductForm product={product} categories={categories ?? []} />
    </div>
  )
}
