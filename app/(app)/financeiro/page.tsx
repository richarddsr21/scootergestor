import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { FinanceiroClient } from "@/components/financial/financeiro-client"

const PAGE_SIZE = 20

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tipo?: string; mes?: string }>
}) {
  const { q, page: pageStr, tipo, mes } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const now = new Date()
  const currentMes = mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const mesStart = `${currentMes}-01`
  const [year, month] = currentMes.split("-").map(Number)
  const mesEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  let txQuery = supabase
    .from("financial_transactions")
    .select("id, type, description, amount, category_id, payment_method, transaction_date", { count: "exact" })
    .eq("company_id", cid)
    .gte("transaction_date", mesStart)
    .lte("transaction_date", mesEnd)
    .order("transaction_date", { ascending: false })
    .range(from, to)

  if (tipo) txQuery = txQuery.eq("type", tipo)
  if (q) txQuery = txQuery.ilike("description", `%${q}%`)

  const [
    { data: categories },
    { data: transactions, count },
    { data: allMonth },
  ] = await Promise.all([
    supabase.from("financial_categories").select("id, name, type").eq("company_id", cid).order("name"),
    txQuery,
    supabase
      .from("financial_transactions")
      .select("type, amount")
      .eq("company_id", cid)
      .gte("transaction_date", mesStart)
      .lte("transaction_date", mesEnd),
  ])

  const totalEntrada = (allMonth ?? []).filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0)
  const totalSaida = (allMonth ?? []).filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0)
  const saldo = totalEntrada - totalSaida

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Controle financeiro do seu negócio." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          { title: "Entradas", value: fmt(totalEntrada), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { title: "Saídas", value: fmt(totalSaida), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          { title: "Saldo", value: fmt(saldo), icon: Wallet, color: saldo >= 0 ? "text-emerald-600" : "text-red-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
        ].map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title} className="py-4">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
                  <div className={`rounded-md p-1.5 ${c.bg}`}><Icon className={`h-4 w-4 ${c.color}`} /></div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
        <FinanceiroClient
          transactions={transactions ?? []}
          categories={categories ?? []}
          count={count ?? 0}
          pageSize={PAGE_SIZE}
          currentMes={currentMes}
          tipo={tipo ?? ""}
        />
      </Suspense>
    </div>
  )
}
