import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Wrench, FileText } from "lucide-react"
import { OsExportButton } from "@/components/service-orders/os-export-button"
import { OsStatusSelector } from "@/components/service-orders/os-status-selector"
import { OsItemsSection } from "@/components/service-orders/os-items-section"
import { OsChecklistSection } from "@/components/service-orders/os-checklist-section"
import { OsNotesSection } from "@/components/service-orders/os-notes-section"
import { OsPayButton } from "@/components/service-orders/os-pay-button"
import { OsVehicleSection } from "@/components/service-orders/os-vehicle-section"
import { OS_PRIORITY_LABELS, OS_PRIORITY_COLORS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { RevisionSection } from "@/components/revisions/revision-section"
import { getCustomerRevisionAction } from "@/lib/actions/revisions"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function OsDetailPage({
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
    { data: os },
    { data: items },
    { data: checklist },
    { data: statuses },
    { data: products },
    { data: existingQuote },
    { data: settings },
    { data: payments },
  ] = await Promise.all([
    supabase.from("service_orders")
      .select("*, customers(id, name, phone, whatsapp), service_order_statuses(id, name, color), vehicles(type, brand, model), profiles(name)")
      .eq("id", id).eq("company_id", cid).single(),
    supabase.from("service_order_items")
      .select("*")
      .eq("service_order_id", id).eq("company_id", cid)
      .order("created_at"),
    supabase.from("service_order_checklists")
      .select("*")
      .eq("service_order_id", id).eq("company_id", cid)
      .order("created_at"),
    supabase.from("service_order_statuses")
      .select("id, name, color, slug, is_final")
      .eq("company_id", cid)
      .order("display_order"),
    supabase.from("products")
      .select("id, name, sale_price, cost_price, stock_quantity")
      .eq("company_id", cid)
      .eq("status", "active")
      .order("name"),
    supabase.from("quotes")
      .select("id, quote_number, status")
      .eq("company_id", cid)
      .eq("service_order_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("company_settings")
      .select("business_name")
      .eq("company_id", cid)
      .maybeSingle(),
    supabase.from("payments")
      .select("method, amount, fee_amount, fee_absorbed, installments")
      .eq("service_order_id", id).eq("company_id", cid)
      .order("created_at"),
  ])

  if (!os) notFound()

  const customer = (os as any).customers
  const revision = customer?.id ? await getCustomerRevisionAction(customer.id) : null
  const status = (os as any).service_order_statuses
  const vehicle = (os as any).vehicles
  const technician = (os as any).profiles

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/oficina"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <PageHeader title={os.order_number} description="Ordem de serviço" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded-full ${OS_PRIORITY_COLORS[os.priority] ?? ""}`}>
            {OS_PRIORITY_LABELS[os.priority]}
          </span>
          {status && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: status.color }}>
              {status.name}
            </span>
          )}
          <OsExportButton osId={id} orderNumber={os.order_number} />
          {existingQuote ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/oficina/orcamentos/${existingQuote.id}`}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                {existingQuote.quote_number}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/oficina/orcamentos/nova?os_id=${id}`}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Gerar orçamento
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Cliente</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {customer ? (
                <>
                  <Link href={`/clientes/${customer.id}`} className="font-medium hover:underline">{customer.name}</Link>
                  {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  {customer.whatsapp && customer.whatsapp !== customer.phone && (
                    <p className="text-muted-foreground">{customer.whatsapp} (WA)</p>
                  )}
                </>
              ) : <p className="text-muted-foreground">—</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4" />Scooter</CardTitle></CardHeader>
            <CardContent>
              <OsVehicleSection
                osId={id}
                vehicleBrand={(os as any).vehicle_brand ?? null}
                vehicleModel={(os as any).vehicle_model ?? null}
                vehicleChassis={(os as any).vehicle_chassis ?? null}
                mileageKm={(os as any).mileage_km ?? null}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Detalhes</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abertura</span>
                <span>{fmtDate(os.created_at)}</span>
              </div>
              {os.expected_delivery_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previsão</span>
                  <span>{fmtDate(os.expected_delivery_at)}</span>
                </div>
              )}
              {technician && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Técnico</span>
                  <span>{technician.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Alterar status</CardTitle></CardHeader>
            <CardContent>
              <OsStatusSelector
                osId={id}
                currentStatusId={status?.id ?? ""}
                statuses={statuses ?? []}
                customerName={customer?.name}
                customerWhatsapp={customer?.whatsapp ?? customer?.phone}
                orderNumber={os.order_number}
                trackingToken={(os as any).tracking_token ?? null}
                storeName={(settings as any)?.business_name ?? "ScooterGestor"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Totais</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mão de obra</span>
                <span>{fmt(os.labor_total ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peças/serviços</span>
                <span>{fmt(os.parts_total ?? 0)}</span>
              </div>
              {(os.discount ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>−{fmt(os.discount ?? 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{fmt(os.total ?? 0)}</span>
              </div>
              <div className="pt-2">
                <OsPayButton osId={id} alreadyPaid={os.payment_status === "pago"} />
              </div>

              {(payments ?? []).length > 0 && (
                <>
                  <Separator />
                  {(payments ?? []).map((p: any, i: number) => {
                    const label = `${PAYMENT_METHOD_LABELS[p.method] ?? p.method}${p.installments > 1 ? ` (${p.installments}x)` : ""}`
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>{label}</span>
                          <span>{fmt(p.amount)}</span>
                        </div>
                        {p.fee_amount > 0 && (
                          <div className="flex justify-between text-amber-600 text-xs">
                            <span>
                              Taxa maquininha
                              {p.fee_absorbed && <span className="ml-1 text-muted-foreground">(absorvida)</span>}
                            </span>
                            <span>+{fmt(p.fee_amount)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {(payments ?? []).some((p: any) => p.fee_amount > 0) && (
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>
                        {(payments ?? []).every((p: any) => p.fee_absorbed)
                          ? "Custo total (loja)"
                          : "Total pago pelo cliente"}
                      </span>
                      <span>{fmt((payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0) + (p.fee_absorbed ? (p.fee_amount ?? 0) : 0), 0))}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {customer?.id && (
            <RevisionSection
              customerId={customer.id}
              initialRevision={revision}
              sourceOsId={id}
            />
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Problema relatado</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{os.reported_problem}</p>
            </CardContent>
          </Card>

          <OsNotesSection
            osId={id}
            technicalDiagnosis={os.technical_diagnosis ?? ""}
            internalNotes={os.internal_notes ?? ""}
            customerNotes={os.customer_notes ?? ""}
          />

          <OsItemsSection osId={id} items={items ?? []} products={products ?? []} />

          {checklist && checklist.length > 0 && (
            <OsChecklistSection osId={id} items={checklist} />
          )}
        </div>
      </div>
    </div>
  )
}
