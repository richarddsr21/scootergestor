import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Package, TrendingUp, TrendingDown } from "lucide-react"
import { StockAdjustButton } from "@/components/products/stock-adjust-button"
import { PRODUCT_TYPE_LABELS } from "@/lib/constants"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function ProdutoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const [{ data: product }, { data: movements }] = await Promise.all([
    supabase.from("products").select("*, product_categories(name)").eq("id", id).eq("company_id", cid).single(),
    supabase.from("stock_movements")
      .select("id, type, reason, quantity, previous_quantity, new_quantity, notes, created_at")
      .eq("product_id", id).eq("company_id", cid)
      .order("created_at", { ascending: false }).limit(30),
  ])

  if (!product) notFound()

  const lowStock = product.stock_quantity <= product.minimum_stock
  const margin = product.cost_price > 0
    ? ((product.sale_price - product.cost_price) / product.cost_price * 100).toFixed(1)
    : null

  const REASON_LABELS: Record<string, string> = {
    venda: "Venda",
    ordem_servico: "OS",
    compra_fornecedor: "Compra",
    ajuste_manual: "Ajuste",
    perda_quebra: "Perda",
    devolucao_cliente: "Devolução",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={product.name} description={PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type} />
        <div className="flex gap-2">
          <StockAdjustButton productId={id} productName={product.name} currentStock={product.stock_quantity} />
          <Button asChild size="sm" variant="outline">
            <Link href={`/produtos/${id}/editar`}><Pencil className="mr-1 h-4 w-4" />Editar</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {product.sku && <div className="flex justify-between"><span className="text-muted-foreground">SKU</span><span>{product.sku}</span></div>}
              {product.brand && <div className="flex justify-between"><span className="text-muted-foreground">Marca</span><span>{product.brand}</span></div>}
              {product.model && <div className="flex justify-between"><span className="text-muted-foreground">Modelo</span><span>{product.model}</span></div>}
              {(product as any).product_categories && (
                <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{(product as any).product_categories.name}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Unidade</span><span>{product.unit}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={product.status === "active" ? "default" : "secondary"}>
                  {product.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Preços</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span>{fmt(product.cost_price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Venda</span><span className="font-semibold text-emerald-600">{fmt(product.sale_price)}</span></div>
              {margin && <div className="flex justify-between"><span className="text-muted-foreground">Margem</span><span>{margin}%</span></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Estoque</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atual</span>
                <span className={`font-bold text-lg ${lowStock ? "text-red-600" : "text-emerald-600"}`}>
                  {product.stock_quantity} {product.unit}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mínimo</span><span>{product.minimum_stock} {product.unit}</span></div>
              {lowStock && <Badge variant="destructive">Estoque baixo</Badge>}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Movimentações recentes</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(!movements || movements.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação.</p>
              ) : (
                <div className="divide-y">
                  {movements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-1.5 ${m.type === "entrada" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"}`}>
                          {m.type === "entrada" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{REASON_LABELS[m.reason] ?? m.reason}</p>
                          {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${m.type === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                          {m.type === "entrada" ? "+" : "-"}{m.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.new_quantity} em estoque</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
