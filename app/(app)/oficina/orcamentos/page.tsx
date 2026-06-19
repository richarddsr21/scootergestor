import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { FileText, Plus } from "lucide-react"

const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  expirado: "Expirado",
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  aprovado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  rejeitado: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  expirado: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function OrcamentosPage({
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
    .from("quotes")
    .select("id, quote_number, status, total, valid_until, created_at, customers(name), service_orders(order_number)", { count: "exact" })
    .eq("company_id", cid)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status) query = query.eq("status", status)
  if (q) query = query.or(`quote_number.ilike.%${q}%`)

  const { data: quotes, count } = await query

  const statuses = ["pendente", "aprovado", "rejeitado", "expirado"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Orçamentos"
          description={`${count ?? 0} orçamento${(count ?? 0) !== 1 ? "s" : ""}`}
        />
        <Button asChild size="sm">
          <Link href="/oficina/orcamentos/nova"><Plus className="mr-1 h-4 w-4" />Novo Orçamento</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por número..." />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant={!status ? "default" : "outline"} asChild>
            <Link href="/oficina/orcamentos">Todos</Link>
          </Button>
          {statuses.map(s => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} asChild>
              <Link href={`/oficina/orcamentos?status=${s}`}>{STATUS_LABELS[s]}</Link>
            </Button>
          ))}
        </div>
      </div>

      {(!quotes || quotes.length === 0) ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento encontrado"
          description="Crie seu primeiro orçamento para um cliente."
        >
          <Button asChild size="sm">
            <Link href="/oficina/orcamentos/nova">Novo Orçamento</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Nº</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Cliente</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">OS</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Total</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Validade</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(quotes as any[]).map(q => (
                  <tr key={q.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{q.quote_number}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{q.customers?.name ?? "—"}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{q.service_orders?.order_number ?? "—"}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status] ?? ""}`}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-right font-medium">{fmt(q.total ?? 0)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{fmtDate(q.valid_until)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/oficina/orcamentos/${q.id}`}>Ver</Link>
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
