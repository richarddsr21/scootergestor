import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Phone, Mail, MapPin, FileText } from "lucide-react"
import { VehiclesSection } from "@/components/customers/vehicles-section"
import { ClienteDetalheExportButton } from "@/components/customers/cliente-detalhe-export-button"
import { OS_PRIORITY_LABELS, OS_PRIORITY_COLORS } from "@/lib/constants"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
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
    supabase.from("service_orders")
      .select("id, order_number, priority, reported_problem, total, created_at, service_order_statuses(name, color)")
      .eq("customer_id", id).eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("company_settings").select("business_name").eq("company_id", cid).maybeSingle(),
  ])

  const companyName = (settings as any)?.business_name ?? "ScooterGestor"

  if (!customer) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={customer.name} description="Detalhes do cliente" />
        <div className="flex items-center gap-2">
          <ClienteDetalheExportButton
            customerId={id}
            customerName={customer.name}
            companyName={companyName}
          />
          <Button asChild size="sm" variant="outline">
            <Link href={`/clientes/${id}/editar`}><Pencil className="mr-1 h-4 w-4" />Editar</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.whatsapp && customer.whatsapp !== customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{customer.whatsapp} (WhatsApp)</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="break-all">{customer.email}</span>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {customer.cpf_cnpj && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{customer.cpf_cnpj}</span>
                </div>
              )}
              {customer.notes && (
                <p className="text-muted-foreground pt-2 border-t">{customer.notes}</p>
              )}
            </CardContent>
          </Card>

          <VehiclesSection vehicles={vehicles ?? []} customerId={id} />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Ordens de serviço</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/oficina/nova?cliente=${id}`}><Plus className="mr-1 h-3 w-3" />Nova OS</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(!serviceOrders || serviceOrders.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma OS encontrada.</p>
              ) : (
                <div className="divide-y">
                  {serviceOrders.map((os: any) => (
                    <Link key={os.id} href={`/oficina/${os.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{os.order_number}</span>
                          {os.service_order_statuses && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: os.service_order_statuses.color }}>
                              {os.service_order_statuses.name}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${OS_PRIORITY_COLORS[os.priority] ?? ""}`}>
                            {OS_PRIORITY_LABELS[os.priority]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{os.reported_problem?.slice(0, 60)}</p>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        {os.total > 0 && <p className="text-sm font-medium">{fmt(os.total)}</p>}
                        <p className="text-xs text-muted-foreground">{fmtDate(os.created_at)}</p>
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
