import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCashRegisterDetailAction } from "@/lib/actions/cash"
import { METHOD_LABELS } from "@/lib/cash-utils"
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export default async function CaixaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const detail = await getCashRegisterDetailAction(id)
  if (!detail) notFound()

  const { register, movements, summary } = detail
  const diff = summary.difference

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/caixa/historico"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-3">
          <PageHeader
            title={`Caixa — ${new Date(register.opened_at).toLocaleDateString("pt-BR")}`}
            description={`Aberto por ${register.opener_name ?? "—"}`}
          />
          {register.status === "open" ? (
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400">Aberto</Badge>
          ) : (
            <Badge variant="secondary">Fechado</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resumo */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fundo inicial</span>
              <span className="font-medium">{fmt(summary.initial_amount)}</span>
            </div>

            {summary.entries_by_method.map((m) => (
              <div key={m.method} className="flex justify-between">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-medium text-emerald-600">+{fmt(m.total)}</span>
              </div>
            ))}

            {summary.total_sangrias > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sangrias</span>
                <span className="font-medium text-red-500">-{fmt(summary.total_sangrias)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total de entradas</span>
              <span>{fmt(summary.total_entries)}</span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Esperado em dinheiro</span>
              <span className="font-medium">{fmt(summary.expected_cash)}</span>
            </div>

            {register.actual_cash_amount !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contado na gaveta</span>
                  <span className="font-medium">{fmt(register.actual_cash_amount)}</span>
                </div>
                {diff !== null && (
                  <div className="flex justify-between font-semibold">
                    <span>Diferença</span>
                    <span className={diff === 0 ? "text-emerald-600" : diff > 0 ? "text-blue-600" : "text-red-500"}>
                      {diff >= 0 ? "+" : ""}{fmt(diff)}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info do caixa */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Abertura</span>
              <span>{fmtDateTime(register.opened_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operador</span>
              <span>{register.opener_name ?? "—"}</span>
            </div>
            {register.closed_at && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fechamento</span>
                  <span>{fmtDateTime(register.closed_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fechado por</span>
                  <span>{register.closer_name ?? "—"}</span>
                </div>
              </>
            )}
            {register.notes && (
              <p className="pt-2 border-t text-muted-foreground">{register.notes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movimentações */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Movimentações ({movements.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação.</p>
          ) : (
            <div className="divide-y">
              {movements.map((m) => (
                <div key={m.id} className="flex items-start justify-between p-4 text-sm">
                  <div className="flex items-start gap-3">
                    {m.type === "entry" ? (
                      <ArrowUpCircle className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">
                        {m.type === "entry"
                          ? (METHOD_LABELS[m.payment_method] ?? m.payment_method)
                          : "Sangria"}
                      </p>
                      {m.description && (
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {fmtDateTime(m.created_at)}
                        {m.creator_name ? ` · ${m.creator_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold tabular-nums ${m.type === "entry" ? "text-emerald-600" : "text-red-500"}`}>
                    {m.type === "entry" ? "+" : "-"}{fmt(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
