import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OpenCashDialog } from "@/components/cash/open-cash-dialog"
import { SangriaDialog } from "@/components/cash/sangria-dialog"
import { CloseCashSheet } from "@/components/cash/close-cash-sheet"
import {
  getOpenCashRegisterAction,
  getCashMovementsAction,
} from "@/lib/actions/cash"
import { buildSummary, METHOD_LABELS } from "@/lib/cash-utils"
import { History, ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react"

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export default async function CaixaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const register = await getOpenCashRegisterAction()
  const movements = register ? await getCashMovementsAction(register.id) : []
  const summary = register ? buildSummary(register.initial_amount, movements, null) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Caixa"
          description={register ? `Aberto às ${fmtDateTime(register.opened_at)}` : "Nenhum caixa aberto"}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="ghost" size="sm">
            <Link href="/caixa/historico">
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Link>
          </Button>
          {register ? (
            <>
              <SangriaDialog />
              <CloseCashSheet initialAmount={register.initial_amount} movements={movements} />
            </>
          ) : (
            <OpenCashDialog />
          )}
        </div>
      </div>

      {!register ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-3">
          <Clock className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Nenhum caixa aberto no momento.</p>
          <p className="text-xs text-muted-foreground">Abra o caixa para começar a registrar movimentações.</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fundo inicial</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{fmt(summary!.initial_amount)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total de entradas</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold text-emerald-600">{fmt(summary!.total_entries)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sangrias</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold text-red-500">{fmt(summary!.total_sangrias)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Esperado em dinheiro</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{fmt(summary!.expected_cash)}</p></CardContent>
            </Card>
          </div>

          {/* Entradas por forma de pagamento */}
          {summary!.entries_by_method.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Entradas por forma de pagamento</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y">
                  {summary!.entries_by_method.map((m) => (
                    <div key={m.method} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium text-emerald-600">{fmt(m.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de movimentações */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Movimentações ({movements.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação ainda.</p>
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
        </>
      )}
    </div>
  )
}
