import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import { CancelSaleButton } from "@/components/sales/cancel-sale-button"
import { SaleReceiptButtons } from "@/components/sales/whatsapp-receipt-button"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { RevisionSection } from "@/components/revisions/revision-section"
import { getCustomerRevisionAction } from "@/lib/actions/revisions"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { dateStyle: "long" })
}

export default async function VendaDetailPage({
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

  const [{ data: sale }, { data: items }, { data: payments }, { data: settings }] = await Promise.all([
    supabase.from("sales")
      .select("*, customers(id, name, phone, whatsapp)")
      .eq("id", id).eq("company_id", cid).single(),
    supabase.from("sale_items")
      .select("id, quantity, unit_price, discount, total, chassis_number, products(name, sku)")
      .eq("sale_id", id).eq("company_id", cid)
      .order("created_at"),
    supabase.from("payments")
      .select("method, amount, fee_amount, installments")
      .eq("sale_id", id).eq("company_id", cid)
      .order("created_at"),
    supabase.from("company_settings")
      .select("business_name, cnpj, phone, whatsapp")
      .eq("company_id", cid).maybeSingle(),
  ])

  if (!sale) notFound()

  const customerId = (sale as any).customers?.id ?? null
  const revision = customerId ? await getCustomerRevisionAction(customerId) : null

  const STATUS_LABELS: Record<string, string> = { concluida: "Concluída", cancelada: "Cancelada", pendente: "Pendente" }
  const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary"> = {
    concluida: "default", cancelada: "destructive", pendente: "secondary",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendas"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <PageHeader title={sale.sale_number} description={fmtDate(sale.created_at)} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANTS[sale.status] ?? "secondary"}>{STATUS_LABELS[sale.status] ?? sale.status}</Badge>
          {sale.status !== "cancelada" && (
            <SaleReceiptButtons
              saleNumber={sale.sale_number}
              createdAt={sale.created_at}
              items={(items ?? []).map((item: any) => ({
                name: item.products?.name ?? "Item",
                sku: item.products?.sku ?? null,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discount: item.discount,
                total: item.total,
              }))}
              subtotal={sale.subtotal}
              discount={sale.discount}
              total={sale.total}
              payments={(payments ?? []).map((p: any) => ({
                method: p.method,
                amount: p.amount,
                feeAmount: p.fee_amount ?? 0,
                installments: p.installments,
              }))}
              customerName={(sale as any).customers?.name ?? "Cliente"}
              customerWhatsapp={(sale as any).customers?.whatsapp ?? (sale as any).customers?.phone ?? null}
              storeName={settings?.business_name ?? ""}
              storeCnpj={settings?.cnpj ?? null}
              storePhone={settings?.whatsapp ?? settings?.phone ?? null}
            />

          )}
          {sale.status !== "cancelada" && <CancelSaleButton id={id} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Itens da venda</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Produto</th>
                    <th className="text-right p-3 font-medium">Qtd</th>
                    <th className="text-right p-3 font-medium">Preço</th>
                    <th className="text-right p-3 font-medium hidden sm:table-cell">Desc.</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(items ?? []).map((item: any) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <p className="font-medium">{item.products?.name ?? "—"}</p>
                        {item.products?.sku && <p className="text-xs text-muted-foreground">{item.products.sku}</p>}
                        {item.chassis_number && <p className="text-xs text-muted-foreground">Chassi: {item.chassis_number}</p>}
                      </td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">{fmt(item.unit_price)}</td>
                      <td className="p-3 text-right hidden sm:table-cell text-muted-foreground">
                        {item.discount > 0 ? `−${fmt(item.discount)}` : "—"}
                      </td>
                      <td className="p-3 text-right font-medium">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {(sale as any).customers && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{(sale as any).customers.name}</p>
                {(sale as any).customers.phone && <p className="text-muted-foreground">{(sale as any).customers.phone}</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Resumo financeiro</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>−{fmt(sale.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-emerald-600">{fmt(sale.total)}</span>
              </div>
              {(payments ?? []).length > 0 && (
                <>
                  <Separator />
                  {(payments ?? []).map((p: any, i: number) => {
                    const label = `${PAYMENT_METHOD_LABELS[p.method] ?? p.method}${p.installments > 1 ? ` (${p.installments}x)` : ""}`
                    const clientAmt = (p.amount ?? 0) + (p.fee_amount ?? 0)
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>{label}</span>
                          <span>{fmt(p.amount)}</span>
                        </div>
                        {p.fee_amount > 0 && (
                          <div className="flex justify-between text-amber-600 text-xs">
                            <span>Taxa maquininha</span>
                            <span>+{fmt(p.fee_amount)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {(payments ?? []).some((p: any) => p.fee_amount > 0) && (
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>Total pago pelo cliente</span>
                      <span>{fmt((payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0) + (p.fee_amount ?? 0), 0))}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {sale.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{sale.notes}</p></CardContent>
            </Card>
          )}

          {customerId && (
            <RevisionSection
              customerId={customerId}
              initialRevision={revision}
              sourceSaleId={id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
