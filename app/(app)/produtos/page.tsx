import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { Plus, Package, AlertTriangle } from "lucide-react"
import { PRODUCT_TYPE_LABELS } from "@/lib/constants"

const PAGE_SIZE = 20

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tipo?: string; categoria?: string }>
}) {
  const { q, page: pageStr, tipo, categoria } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id

  const [{ data: categories }] = await Promise.all([
    supabase.from("product_categories").select("id, name").eq("company_id", cid).order("name"),
  ])

  let query = supabase
    .from("products")
    .select("id, name, sku, product_type, sale_price, cost_price, stock_quantity, minimum_stock, status, category_id, brand, model", { count: "exact" })
    .eq("company_id", cid)
    .eq("status", "active")
    .order("name")
    .range(from, to)

  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)
  if (tipo) query = query.eq("product_type", tipo)
  if (categoria) query = query.eq("category_id", categoria)

  const { data: products, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Produtos" description={`${count ?? 0} produto${(count ?? 0) !== 1 ? "s" : ""}`} />
        <Button asChild size="sm">
          <Link href="/produtos/novo"><Plus className="mr-1 h-4 w-4" />Novo produto</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por nome, SKU, marca..." />
        </div>
      </div>

      {(!products || products.length === 0) ? (
        <EmptyState icon={Package} title="Nenhum produto encontrado"
          description={q ? "Tente outro termo de busca." : "Cadastre seu primeiro produto."}>
          {!q && (
            <Button asChild size="sm">
              <Link href="/produtos/novo"><Plus className="mr-1 h-4 w-4" />Novo produto</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Produto</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Tipo</th>
                  <th className="text-right p-3 font-medium">Preço venda</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Estoque</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => {
                  const lowStock = p.stock_quantity <= p.minimum_stock
                  return (
                    <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                          {(p.brand || p.model) && (
                            <p className="text-xs text-muted-foreground">{[p.brand, p.model].filter(Boolean).join(" ")}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {PRODUCT_TYPE_LABELS[p.product_type] ?? p.product_type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">{fmt(p.sale_price)}</td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 ${lowStock ? "text-red-600" : "text-foreground"}`}>
                          {lowStock && <AlertTriangle className="h-3 w-3" />}
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/produtos/${p.id}`}>Ver</Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  )
}
