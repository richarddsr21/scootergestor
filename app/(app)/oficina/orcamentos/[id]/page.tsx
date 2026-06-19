import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { OrcamentoExportButton } from "@/components/quotes/orcamento-export-button"
import { WhatsAppActions } from "@/components/quotes/whatsapp-actions"
import { QuoteItemsSection } from "@/components/quotes/quote-items-section"
import { QuoteStatusActions } from "@/components/quotes/quote-status-actions"
import { APP_URL } from "@/lib/constants"

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

export default async function QuoteDetailPage({
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
    { data: quote },
    { data: items },
    { data: products },
    { data: settings },
  ] = await Promise.all([
    supabase.from("quotes")
      .select("*, customers(id, name, phone, whatsapp), service_orders(id, order_number, tracking_token)")
      .eq("id", id).eq("company_id", cid).single(),
    supabase.from("quote_items")
      .select("*")
      .eq("quote_id", id).eq("company_id", cid)
      .order("created_at"),
    supabase.from("products")
      .select("id, name, sale_price")
      .eq("company_id", cid).eq("status", "active").order("name"),
    supabase.from("company_settings")
      .select("business_name, whatsapp")
      .eq("company_id", cid).maybeSingle(),
  ])

  if (!quote) notFound()

  const q = quote as any
  const customer = q.customers
  const os = q.service_orders
  const isPending = q.status === "pendente"


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/oficina/orcamentos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <PageHeader title={q.quote_number} description="Orçamento" />
        </div>
        <div className="flex items-center gap-2">
          <OrcamentoExportButton quoteId={id} quoteNumber={q.quote_number} />
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[q.status] ?? ""}`}>
            {STATUS_LABELS[q.status] ?? q.status}
          </span>
        </div>
      </div>

      {/* WhatsApp CTA — shown while pending */}
      {isPending && (
        <WhatsAppActions
          customerName={customer?.name ?? "Cliente"}
          customerWhatsapp={customer?.whatsapp ?? customer?.phone ?? null}
          quoteNumber={q.quote_number}
          total={q.total ?? 0}
          storeName={(settings as any)?.business_name ?? "ScooterGestor"}
          appUrl={APP_URL}
          orderNumber={os?.order_number}
          trackingToken={os?.tracking_token}
          osId={os?.id}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-sm">Detalhes</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              {os && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OS vinculada</span>
                  <Link href={`/oficina/${os.id}`} className="font-medium hover:underline flex items-center gap-1">
                    {os.order_number} <ExternalLink className="size-3" />
                  </Link>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emissão</span>
                <span>{fmtDate(q.created_at)}</span>
              </div>
              {q.valid_until && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Válido até</span>
                  <span>{fmtDate(q.valid_until)}</span>
                </div>
              )}
              {q.approved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aprovado em</span>
                  <span>{fmtDate(q.approved_at)}</span>
                </div>
              )}
              {q.rejected_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejeitado em</span>
                  <span>{fmtDate(q.rejected_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(q.subtotal ?? 0)}</span>
              </div>
              {(q.discount ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>−{fmt(q.discount ?? 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{fmt(q.total ?? 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Approve/reject actions — only when pending */}
          {isPending && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Cliente aprovou?</CardTitle></CardHeader>
              <CardContent>
                <QuoteStatusActions quoteId={id} />
              </CardContent>
            </Card>
          )}

          {os?.tracking_token && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Link de acompanhamento</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <a
                  href={`${APP_URL}/acompanhar/${os.tracking_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all flex items-center gap-1"
                >
                  Ver como cliente <ExternalLink className="size-3 shrink-0" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {q.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{q.notes}</p>
              </CardContent>
            </Card>
          )}

          <QuoteItemsSection
            quoteId={id}
            items={items ?? []}
            products={products ?? []}
            readonly={q.status !== "pendente"}
          />
        </div>
      </div>
    </div>
  )
}
