import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MetricCard } from "@/components/shared/metric-card"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { ClientesExportButton } from "@/components/customers/clientes-export-button"
import { Plus, Users, Phone, Mail, MapPin, Bike, CalendarDays, UserCheck } from "lucide-react"

const PAGE_SIZE = 20

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total de clientes"
          value={String(totalCount ?? 0)}
          icon={Users}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <MetricCard
          title="Novos este mês"
          value={String(newThisMonth ?? 0)}
          icon={UserCheck}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
        <MetricCard
          title="Com scooter"
          value={String(withVehicles ?? 0)}
          icon={Bike}
          colorClass="text-violet-600 dark:text-violet-400"
          bgClass="bg-violet-500/10"
        />
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
              const color = avatarColor(c.name)
              return (
                <Link key={c.id} href={`/clientes/${c.id}`}>
                  <Card className="group hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-pointer border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold select-none ${color}`}
                        >
                          {initials(c.name)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 justify-between">
                            <p className="font-semibold text-sm truncate">{c.name}</p>
                            {vCount > 0 && (
                              <Badge variant="secondary" className="shrink-0 text-xs gap-1 py-0">
                                <Bike className="h-2.5 w-2.5" />
                                {vCount}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1.5 space-y-0.5">
                            {(c.whatsapp || c.phone) && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {c.whatsapp ?? c.phone}
                                </span>
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                              </div>
                            )}
                            {(c.city || c.state) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
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
