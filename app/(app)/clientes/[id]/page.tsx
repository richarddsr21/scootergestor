import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Phone, Mail, MapPin, FileText, Bike, Wrench, DollarSign, CalendarDays, MessageCircle } from "lucide-react"
import { VehiclesSection } from "@/components/customers/vehicles-section"
import { ClienteDetalheExportButton } from "@/components/customers/cliente-detalhe-export-button"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { StatusPill } from "@/components/shared/status-pill"
import { priorityZone, priorityLabel } from "@/lib/constants"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

const AVATAR_COLORS = [
  "bg-avatar-teal",
  "bg-avatar-violet",
  "bg-avatar-amber",
  "bg-avatar-coral",
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default async function ClienteDetailPage({
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

  const [
    { data: customer },
    { data: vehicles },
    { data: serviceOrders },
    { data: settings },
  ] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("company_id", cid).single(),
    supabase.from("vehicles").select("*").eq("customer_id", id).eq("company_id", cid).order("created_at"),
    supabase
      .from("service_orders")
      .select("id, order_number, priority, reported_problem, total, created_at, delivered_at, service_order_statuses(name, color)")
      .eq("customer_id", id)
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("company_settings").select("business_name").eq("company_id", cid).maybeSingle(),
  ])

  if (!customer) notFound()

  const companyName = (settings as any)?.business_name ?? "ScooterGestor"
  const totalGasto = (serviceOrders ?? []).reduce((sum, os: any) => sum + (os.total ?? 0), 0)
  const osAbertasCount = (serviceOrders ?? []).filter((os: any) => !os.delivered_at).length
  const color = avatarColor(customer.name)

  const whatsappLink = (customer.whatsapp || customer.phone)
    ? `https://wa.me/55${(customer.whatsapp ?? customer.phone ?? "").replace(/\D/g, "")}`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-xl font-bold select-none shadow-md ${color}`}
          >
            {initials(customer.name)}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {customer.city && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[customer.city, customer.state].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                cliente desde {fmtDate(customer.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {whatsappLink && (
            <Button asChild size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950/50">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1.5 h-4 w-4" />WhatsApp
              </a>
            </Button>
          )}
          <ClienteDetalheExportButton
            customerId={id}
            customerName={customer.name}
            companyName={companyName}
          />
          <Button asChild size="sm" variant="outline">
            <Link href={`/clientes/${id}/editar`}>
              <Pencil className="mr-1 h-4 w-4" />Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile title="Total gasto" numericValue={totalGasto} format="currency" icon={<DollarSign />} />
        <KpiTile title="Total de OS" numericValue={serviceOrders?.length ?? 0} icon={<Wrench />} />
        <KpiTile title="OS em aberto" numericValue={osAbertasCount} icon={<Wrench />} />
        <KpiTile title="Scooters" numericValue={vehicles?.length ?? 0} icon={<Bike />} />
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* Contact card */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações de contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.whatsapp && customer.whatsapp !== customer.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="text-sm font-medium">{customer.whatsapp}</p>
                  </div>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium break-all">{customer.email}</p>
                  </div>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Endereço</p>
                    <p className="text-sm font-medium">
                      {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
              {customer.cpf_cnpj && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPF / CNPJ</p>
                    <p className="text-sm font-medium font-mono">{customer.cpf_cnpj}</p>
                  </div>
                </div>
              )}
              {customer.notes && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm text-muted-foreground">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <VehiclesSection vehicles={vehicles ?? []} customerId={id} />
        </div>

        {/* OS history */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Histórico de OS</CardTitle>
                {(serviceOrders?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {serviceOrders!.length} ordem{serviceOrders!.length !== 1 ? "s" : ""} no total
                  </p>
                )}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/oficina/nova?cliente=${id}`}>
                  <Plus className="mr-1 h-3 w-3" />Nova OS
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(!serviceOrders || serviceOrders.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Nenhuma OS encontrada</p>
                  <p className="text-xs text-muted-foreground mt-1">Crie a primeira ordem de serviço para este cliente.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {serviceOrders.map((os: any) => (
                    <Link
                      key={os.id}
                      href={`/oficina/${os.id}`}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold font-mono">{os.order_number}</span>
                          {os.service_order_statuses && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: os.service_order_statuses.color }}
                            >
                              {os.service_order_statuses.name}
                            </span>
                          )}
                          {(os.priority === "urgente" || os.priority === "alta") && (
                            <StatusPill zone={priorityZone(os.priority)} label={priorityLabel(os.priority)} />
                          )}
                        </div>
                        {os.reported_problem && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-xs">
                            {os.reported_problem.slice(0, 70)}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        {os.total > 0 && (
                          <p className="text-sm font-semibold tabular-nums">{fmt(os.total)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{fmtDateTime(os.created_at)}</p>
                      </div>
                    </Link>
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
