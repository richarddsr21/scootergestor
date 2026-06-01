import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/products/product-form"

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

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
