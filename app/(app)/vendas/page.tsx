import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { Plus, ShoppingCart } from "lucide-react"

const PAGE_SIZE = 20

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

const STATUS_LABELS: Record<string, string> = { concluida: "Concluída", cancelada: "Cancelada", pendente: "Pendente" }
const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary"> = {
  concluida: "default",
  cancelada: "destructive",
  pendente: "secondary",
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>
}) {
  const { q, page: pageStr, status } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  let query = supabase
    .from("sales")
    .select("id, sale_number, total, status, payment_status, created_at, customers(name)", { count: "exact" })
    .eq("company_id", cid)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (q) query = query.ilike("sale_number", `%${q}%`)
  if (status) query = query.eq("status", status)

  const { data: sales, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Vendas" description={`${count ?? 0} venda${(count ?? 0) !== 1 ? "s" : ""}`} />
        <Button asChild size="sm">
          <Link href="/vendas/nova"><Plus className="mr-1 h-4 w-4" />Nova venda</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por número..." />
        </div>
        <div className="flex gap-1">
          {([["", "Todas"], ["concluida", "Concluídas"], ["cancelada", "Canceladas"]] as const).map(([s, l]) => (
            <Button key={s} asChild size="sm" variant={(status ?? "") === s ? "default" : "outline"}>
              <Link href={s ? `/vendas?status=${s}` : "/vendas"}>{l}</Link>
            </Button>
          ))}
        </div>
      </div>

      {(!sales || sales.length === 0) ? (
        <EmptyState icon={ShoppingCart} title="Nenhuma venda encontrada"
          description="Realize sua primeira venda no PDV.">
          <Button asChild size="sm"><Link href="/vendas/nova">Ir ao PDV</Link></Button>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Número</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Cliente</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Data</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{s.sale_number}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{s.customers?.name ?? "—"}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{fmtDate(s.created_at)}</td>
                    <td className="p-3 text-right font-semibold">{fmt(s.total)}</td>
                    <td className="p-3 text-center">
                      <Badge variant={STATUS_VARIANTS[s.status] ?? "secondary"}>{STATUS_LABELS[s.status] ?? s.status}</Badge>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendas/${s.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  )
}
