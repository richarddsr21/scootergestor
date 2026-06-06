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
import { Plus, ShieldCheck, AlertTriangle, Clock } from "lucide-react"

const PAGE_SIZE = 20

const WARRANTY_TYPE_LABELS: Record<string, string> = {
  produto: "Produto",
  servico: "Serviço",
  bateria: "Bateria",
  carregador: "Carregador",
  scooter: "Scooter",
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  expired: { label: "Expirada", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  claimed: { label: "Acionada", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR")
}

function daysLeft(endDate: string) {
  const end = new Date(endDate + "T00:00:00")
  const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000)
  return diff
}

export default async function GarantiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const { q, status, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  // When searching by customer name, resolve matching customer IDs first
  // (Supabase does not support ilike on joined relation columns)
  let customerIds: string[] | null = null
  if (q) {
    const { data: matched } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", cid)
      .ilike("name", `%${q}%`)
    customerIds = (matched ?? []).map((c) => c.id)
  }

  let query = supabase
    .from("warranties")
    .select(
      "id, warranty_type, start_date, end_date, status, notes, customers(id, name), products(id, name)",
      { count: "exact" }
    )
    .eq("company_id", cid)
    .order("end_date", { ascending: true })
    .range(from, to)

  if (status) query = query.eq("status", status)
  if (customerIds !== null) {
    if (customerIds.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader title="Garantias" description="0 garantias" />
            <Button asChild size="sm">
              <Link href="/garantias/nova"><Plus className="mr-1 h-4 w-4" />Nova garantia</Link>
            </Button>
          </div>
          <EmptyState icon={ShieldCheck} title="Nenhum cliente encontrado" description="Tente outro nome." />
        </div>
      )
    }
    query = query.in("customer_id", customerIds)
  }

  const { data: warranties, count } = await query

  const activeCount = warranties?.filter((w) => w.status === "active").length ?? 0
  const expiringCount = warranties?.filter((w) => {
    const days = daysLeft(w.end_date)
    return w.status === "active" && days >= 0 && days <= 30
  }).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Garantias"
          description={`${count ?? 0} garantia${(count ?? 0) !== 1 ? "s" : ""}`}
        />
        <Button asChild size="sm">
          <Link href="/garantias/nova">
            <Plus className="mr-1 h-4 w-4" />Nova garantia
          </Link>
        </Button>
      </div>

      {expiringCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong>{expiringCount}</strong> garantia{expiringCount !== 1 ? "s" : ""} vence{expiringCount !== 1 ? "m" : ""} nos próximos 30 dias.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por cliente..." />
        </div>
        <div className="flex gap-1">
          {[
            { value: "", label: "Todas" },
            { value: "active", label: "Ativas" },
            { value: "claimed", label: "Acionadas" },
            { value: "expired", label: "Expiradas" },
          ].map((f) => (
            <Link key={f.value} href={`/garantias${f.value ? `?status=${f.value}` : ""}`}>
              <Button
                variant={status === f.value || (!status && f.value === "") ? "default" : "outline"}
                size="sm"
              >
                {f.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {(!warranties || warranties.length === 0) ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma garantia encontrada"
          description={q || status ? "Tente ajustar os filtros." : "Registre garantias de produtos e serviços."}
        >
          {!q && !status && (
            <Button asChild size="sm">
              <Link href="/garantias/nova">
                <Plus className="mr-1 h-4 w-4" />Nova garantia
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Tipo</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Período</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Vencimento</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(warranties as any[]).map((w) => {
                  const days = daysLeft(w.end_date)
                  const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.active
                  const expiring = w.status === "active" && days >= 0 && days <= 30

                  return (
                    <tr key={w.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <p className="font-medium">{w.customers?.name ?? "—"}</p>
                        {w.products?.name && (
                          <p className="text-xs text-muted-foreground">{w.products.name}</p>
                        )}
                      </td>
                      <td className="p-3 hidden sm:table-cell text-muted-foreground">
                        {WARRANTY_TYPE_LABELS[w.warranty_type] ?? w.warranty_type}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {fmtDate(w.start_date)} → {fmtDate(w.end_date)}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {w.status === "active" ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${expiring ? "text-amber-600" : days < 0 ? "text-slate-500" : "text-emerald-600"}`}>
                            {expiring && <Clock className="h-3 w-3" />}
                            {days < 0 ? "Vencida" : days === 0 ? "Vence hoje" : `${days} dias`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{fmtDate(w.end_date)}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/garantias/${w.id}`}>Ver</Link>
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
