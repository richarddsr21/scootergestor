import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { ClientesExportButton } from "@/components/customers/clientes-export-button"
import { Plus, Users, Phone, Mail, MapPin, Bike, CalendarDays, UserCheck } from "lucide-react"
import { initials, avatarColorName, AVATAR_BG, AVATAR_HOVER_CARD, AVATAR_ICON_TEXT } from "@/lib/avatar"

const PAGE_SIZE = 20

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  let customerQuery = supabase
    .from("customers")
    .select("id, name, phone, whatsapp, email, city, state, cpf_cnpj, created_at", { count: "exact" })
    .eq("company_id", cid)
    .order("name")
    .range(from, to)

  if (q) {
    customerQuery = customerQuery.or(
      `name.ilike.%${q}%,phone.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,email.ilike.%${q}%`
    )
  }

  const [
    { data: settings },
    { data: customers, count },
    { count: totalCount },
    { count: newThisMonth },
    { count: withVehicles },
  ] = await Promise.all([
    supabase.from("company_settings").select("business_name").eq("company_id", cid).maybeSingle(),
    customerQuery,
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", cid),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", cid)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("vehicles")
      .select("customer_id", { count: "exact", head: true })
      .eq("company_id", cid),
  ])

  const companyName = (settings as any)?.business_name ?? "ScooterGestor"

  // Fetch vehicle counts for customers on this page
  const customerIds = (customers ?? []).map((c) => c.id)
  const vehicleCountMap: Record<string, number> = {}

  if (customerIds.length > 0) {
    const { data: vehicleRows } = await supabase
      .from("vehicles")
      .select("customer_id")
      .eq("company_id", cid)
      .in("customer_id", customerIds)

    for (const v of vehicleRows ?? []) {
      vehicleCountMap[v.customer_id] = (vehicleCountMap[v.customer_id] ?? 0) + 1
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" description="Gerencie sua base de clientes" />
        <div className="flex items-center gap-2">
          <ClientesExportButton companyName={companyName} />
          <Button asChild size="sm">
            <Link href="/clientes/novo">
              <Plus className="mr-1 h-4 w-4" />Novo cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile title="Total de clientes" numericValue={totalCount ?? 0} icon={<Users />} />
        <KpiTile title="Novos este mês" numericValue={newThisMonth ?? 0} icon={<UserCheck />} />
        <KpiTile title="Com scooter" numericValue={withVehicles ?? 0} icon={<Bike />} />
      </div>

      <div className="max-w-sm">
        <SearchInput placeholder="Buscar por nome, telefone, CPF..." />
      </div>

      {(!customers || customers.length === 0) ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={q ? "Tente ajustar o filtro de busca." : "Cadastre seu primeiro cliente."}
        >
          {!q && (
            <Button asChild size="sm">
              <Link href="/clientes/novo">
                <Plus className="mr-1 h-4 w-4" />Novo cliente
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => {
              const vCount = vehicleCountMap[c.id] ?? 0
              const color = avatarColorName(c.name)
              return (
                <Link key={c.id} href={`/clientes/${c.id}`}>
                  <Card className={`group border-border/60 transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 cursor-pointer ${AVATAR_HOVER_CARD[color]}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold select-none ${AVATAR_BG[color]}`}
                        >
                          {initials(c.name)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 justify-between">
                            <p className="font-display font-semibold text-sm truncate">{c.name}</p>
                            {vCount > 0 && (
                              <Badge variant="secondary" className="shrink-0 text-xs gap-1 py-0">
                                <Bike className={`h-2.5 w-2.5 ${AVATAR_ICON_TEXT[color]}`} />
                                {vCount}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1.5 space-y-1">
                            {(c.whatsapp || c.phone) && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {c.whatsapp ?? c.phone}
                                </span>
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                              </div>
                            )}
                            {(c.city || c.state) && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {[c.city, c.state].filter(Boolean).join(" – ")}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                            <CalendarDays className="h-2.5 w-2.5" />
                            desde {fmtDate(c.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
          <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  )
}
