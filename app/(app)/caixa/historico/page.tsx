import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/shared/pagination"
import { listCashRegistersAction } from "@/lib/actions/cash"
import { buildSummary } from "@/lib/cash-utils"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 20

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export default async function CaixaHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const { data: registers, count } = await listCashRegistersAction(page, PAGE_SIZE)

  // Para cada caixa, busca os totais de movimentações
  const supabase = await createClient()
  const summaries = await Promise.all(
    registers.map(async (r) => {
      const { data: movs } = await supabase
        .from("cash_movements")
        .select("type, payment_method, amount")
        .eq("cash_register_id", r.id)
      const movements = (movs ?? []) as { type: string; payment_method: string; amount: number; description: null; source_type: null; source_id: null; id: string; cash_register_id: string; created_at: string; created_by: null; creator_name?: string }[]
      return buildSummary(r.initial_amount, movements, r.actual_cash_amount)
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/caixa"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title="Histórico de caixas"
          description={`${count} caixa${count !== 1 ? "s" : ""} registrado${count !== 1 ? "s" : ""}`}
        />
      </div>

      {registers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-2">
          <p className="text-muted-foreground text-sm">Nenhum caixa fechado ainda.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Abertura</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Fechamento</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Operador</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">Diferença</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {registers.map((r, i) => {
                  const s = summaries[i]
                  const diff = s.difference

                  return (
                    <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <p className="font-medium">{fmtDateTime(r.opened_at)}</p>
                        <p className="text-xs text-muted-foreground">Fundo: {fmt(r.initial_amount)}</p>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {r.closed_at ? fmtDateTime(r.closed_at) : "—"}
                      </td>
                      <td className="p-3 hidden sm:table-cell text-muted-foreground">
                        {r.opener_name ?? "—"}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {fmt(s.total_entries)}
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell">
                        {diff !== null ? (
                          <span className={`font-medium ${diff === 0 ? "text-emerald-600" : diff > 0 ? "text-blue-600" : "text-red-500"}`}>
                            {diff >= 0 ? "+" : ""}{fmt(diff)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3">
                        {r.status === "open" ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400">Aberto</Badge>
                        ) : (
                          <Badge variant="secondary">Fechado</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Link href={`/caixa/historico/${r.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={count} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  )
}
