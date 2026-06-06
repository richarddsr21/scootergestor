import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { Plus, Wrench } from "lucide-react"
import { OS_PRIORITY_LABELS, OS_PRIORITY_COLORS } from "@/lib/constants"

const PAGE_SIZE = 20

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function OficinaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string; entregue?: string }>
}) {
  const { q, page: pageStr, status, entregue } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const [{ data: statuses }] = await Promise.all([
    supabase.from("service_order_statuses").select("id, name, color, slug").eq("company_id", cid).order("display_order"),
  ])

  let query = supabase
    .from("service_orders")
    .select("id, order_number, priority, reported_problem, total, created_at, customers(name), service_order_statuses(name, color)", { count: "exact" })
    .eq("company_id", cid)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (entregue !== "1") query = query.is("delivered_at", null)
  if (status) query = query.eq("status_id", status)
  if (q) query = query.or(`order_number.ilike.%${q}%,reported_problem.ilike.%${q}%`)

  const { data: orders, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Oficina" description={`${count ?? 0} ordem${(count ?? 0) !== 1 ? "s" : ""} de serviço`} />
        <Button asChild size="sm">
          <Link href="/oficina/nova"><Plus className="mr-1 h-4 w-4" />Nova OS</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por número ou problema..." />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant={!status && !entregue ? "default" : "outline"} asChild>
            <Link href="/oficina">Em aberto</Link>
          </Button>
          {(statuses ?? []).map(s => (
            <Button key={s.id} size="sm" variant={status === s.id ? "default" : "outline"} asChild>
              <Link href={`/oficina?status=${s.id}`}>{s.name}</Link>
            </Button>
          ))}
          <Button size="sm" variant={entregue === "1" ? "default" : "outline"} asChild>
            <Link href="/oficina?entregue=1">Todas</Link>
          </Button>
        </div>
      </div>

      {(!orders || orders.length === 0) ? (
        <EmptyState icon={Wrench} title="Nenhuma OS encontrada"
          description="Abra a primeira ordem de serviço.">
          <Button asChild size="sm"><Link href="/oficina/nova"><Plus className="mr-1 h-4 w-4" />Nova OS</Link></Button>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">OS</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Cliente</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Problema</th>
                  <th className="text-center p-3 font-medium">Prioridade</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Status</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Data</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((os: any) => (
                  <tr key={os.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{os.order_number}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{os.customers?.name ?? "—"}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      <span className="truncate max-w-xs block">{os.reported_problem?.slice(0, 50)}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${OS_PRIORITY_COLORS[os.priority] ?? ""}`}>
                        {OS_PRIORITY_LABELS[os.priority]}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {os.service_order_statuses && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: os.service_order_statuses.color }}>
                          {os.service_order_statuses.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{fmtDate(os.created_at)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/oficina/${os.id}`}>Ver</Link>
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
