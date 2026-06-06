import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WarrantyStatusButton } from "@/components/warranties/warranty-status-button"
import { DeleteWarrantyButton } from "@/components/warranties/delete-warranty-button"
import { Pencil, Calendar, User, Package, Wrench, Tag } from "lucide-react"

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
  return Math.ceil((new Date(endDate + "T00:00:00").getTime() - Date.now()) / 86_400_000)
}

export default async function GarantiaDetailPage({
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

  const { data: warranty } = await supabase
    .from("warranties")
    .select(`
      *,
      customers(id, name, phone, whatsapp, email),
      products(id, name, sku),
      vehicles(id, brand, model, type),
      service_orders(id, order_number)
    `)
    .eq("id", id)
    .eq("company_id", cid)
    .single()

  if (!warranty) notFound()

  const days = daysLeft(warranty.end_date)
  const cfg = STATUS_CONFIG[warranty.status] ?? STATUS_CONFIG.active

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <PageHeader
            title={`Garantia — ${WARRANTY_TYPE_LABELS[warranty.warranty_type] ?? warranty.warranty_type}`}
            description={(warranty.customers as any)?.name ?? ""}
          />
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <WarrantyStatusButton id={id} current={warranty.status as any} />
          <Button asChild size="sm" variant="outline">
            <Link href={`/garantias/${id}/editar`}>
              <Pencil className="mr-1 h-4 w-4" />Editar
            </Link>
          </Button>
          <DeleteWarrantyButton id={id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Detalhes da garantia</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">{WARRANTY_TYPE_LABELS[warranty.warranty_type] ?? warranty.warranty_type}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Início:</span>
              <span className="font-medium">{fmtDate(warranty.start_date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Término:</span>
              <span className="font-medium">{fmtDate(warranty.end_date)}</span>
              {warranty.status === "active" && (
                <span className={`text-xs font-medium ${days < 0 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                  ({days < 0 ? "vencida" : days === 0 ? "vence hoje" : `${days} dias restantes`})
                </span>
              )}
            </div>

            {(warranty.products as any) && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Produto:</span>
                <Link href={`/produtos/${(warranty.products as any).id}`} className="font-medium text-primary hover:underline">
                  {(warranty.products as any).name}
                </Link>
              </div>
            )}

            {(warranty.service_orders as any) && (
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">OS:</span>
                <Link href={`/oficina/${(warranty.service_orders as any).id}`} className="font-medium text-primary hover:underline">
                  {(warranty.service_orders as any).order_number}
                </Link>
              </div>
            )}

            {warranty.notes && (
              <p className="pt-2 border-t text-muted-foreground">{warranty.notes}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(warranty.customers as any) ? (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Link href={`/clientes/${(warranty.customers as any).id}`} className="font-medium text-primary hover:underline">
                    {(warranty.customers as any).name}
                  </Link>
                </div>
                {(warranty.customers as any).phone && (
                  <p className="text-muted-foreground pl-6">{(warranty.customers as any).phone}</p>
                )}
                {(warranty.customers as any).email && (
                  <p className="text-muted-foreground pl-6 break-all">{(warranty.customers as any).email}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Cliente não encontrado.</p>
            )}

            {(warranty.vehicles as any) && (
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Veículo</p>
                <p className="font-medium">
                  {[(warranty.vehicles as any).brand, (warranty.vehicles as any).model].filter(Boolean).join(" ") || (warranty.vehicles as any).type}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
