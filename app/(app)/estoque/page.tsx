import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { AlertTriangle, Package, TrendingDown, TrendingUp, ArrowUpDown } from "lucide-react"
import { StockAdjustButton } from "@/components/products/stock-adjust-button"

const PAGE_SIZE = 20

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filtro?: string }>
}) {
  const { q, page: pageStr, filtro } = await searchParams
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

  let query = supabase
    .from("products")
    .select("id, name, sku, stock_quantity, minimum_stock, unit, sale_price, cost_price, product_type", { count: "exact" })
    .eq("company_id", cid)
    .eq("status", "active")
    .order("name")
    .range(from, to)

  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  if (filtro === "baixo") query = query.filter("stock_quantity", "lte", "minimum_stock")
  if (filtro === "zerado") query = query.eq("stock_quantity", 0)

  const { data: products, count } = await query

  // Summary stats
  const { data: allProducts } = await supabase
    .from("products")
    .select("stock_quantity, minimum_stock, cost_price")
    .eq("company_id", cid)
    .eq("status", "active")

  const totalItems = allProducts?.length ?? 0
  const lowStockCount = allProducts?.filter(p => p.stock_quantity <= p.minimum_stock).length ?? 0
  const zeroStockCount = allProducts?.filter(p => p.stock_quantity === 0).length ?? 0
  const totalValue = (allProducts ?? []).reduce((s, p) => s + p.stock_quantity * p.cost_price, 0)

  const FILTER_LABELS: Record<string, string> = { "": "Todos", baixo: "Estoque baixo", zerado: "Zerado" }

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" description="Controle de estoque dos produtos." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { title: "Total de produtos", value: totalItems, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { title: "Estoque baixo", value: lowStockCount, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
          { title: "Sem estoque", value: zeroStockCount, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          { title: "Valor em estoque", value: fmt(totalValue), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
        ].map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title} className="py-4">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{c.title}</CardTitle>
                  <div className={`rounded-md p-1.5 ${c.bg}`}><Icon className={`h-4 w-4 ${c.color}`} /></div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar produto..." />
        </div>
        <div className="flex gap-1">
          {(["", "baixo", "zerado"] as const).map((f) => (
            <Button key={f} asChild size="sm" variant={(filtro ?? "") === f ? "default" : "outline"}>
              <Link href={f ? `/estoque?filtro=${f}` : "/estoque"}>{FILTER_LABELS[f]}</Link>
            </Button>
          ))}
        </div>
      </div>

      {(!products || products.length === 0) ? (
        <EmptyState icon={Package} title="Nenhum produto" description="Nenhum produto encontrado com esse filtro." />
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Produto</th>
                  <th className="text-right p-3 font-medium">Atual</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Mínimo</th>
                  <th className="text-right p-3 font-medium hidden md:table-cell">Custo unit.</th>
                  <th className="text-right p-3 font-medium hidden md:table-cell">Valor total</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => {
                  const lowStock = p.stock_quantity <= p.minimum_stock
                  return (
                    <tr key={p.id} className={`hover:bg-muted/50 transition-colors ${lowStock ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                      <td className="p-3">
                        <div>
                          <Link href={`/produtos/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                          {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${lowStock ? "text-red-600" : ""}`}>
                          {p.stock_quantity} <span className="text-xs text-muted-foreground">{p.unit}</span>
                        </span>
                        {lowStock && p.stock_quantity > 0 && <AlertTriangle className="inline h-3 w-3 text-orange-500 ml-1" />}
                        {p.stock_quantity === 0 && <Badge variant="destructive" className="ml-1 text-xs">Zerado</Badge>}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell text-muted-foreground">{p.minimum_stock}</td>
                      <td className="p-3 text-right hidden md:table-cell text-muted-foreground">{fmt(p.cost_price)}</td>
                      <td className="p-3 text-right hidden md:table-cell">{fmt(p.stock_quantity * p.cost_price)}</td>
                      <td className="p-3">
                        <StockAdjustButton productId={p.id} productName={p.name} currentStock={p.stock_quantity} />
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
