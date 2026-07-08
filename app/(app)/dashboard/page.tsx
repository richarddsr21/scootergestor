import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { MetricChip } from "@/components/dashboard/metric-chip"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { bucketByDay } from "@/lib/dashboard-charts"
import { Gauge } from "@/components/dashboard/gauge"
import { ZoneBar } from "@/components/dashboard/zone-bar"
import { StatusPill } from "@/components/shared/status-pill"
import { cn } from "@/lib/utils"
import {
  DollarSign, ShoppingCart, Wrench, AlertTriangle,
  Users, CheckCircle, Clock, ArrowRight,
  Plus, CreditCard, Banknote, Smartphone,
} from "lucide-react"

const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Débito", debit_card: "Débito",
  cartao_credito: "Crédito", credit_card: "Crédito",
  boleto: "Boleto", bank_slip: "Boleto",
  payment_link: "Link", misto: "Misto", outro: "Outro",
}

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  pix: Smartphone,
  dinheiro: Banknote,
  cash: Banknote,
}

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, normal: 2, baixa: 3 }

function methodIcon(method: string) {
  return METHOD_ICONS[method] ?? CreditCard
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function priorityZone(priority: string): "optimal" | "warning" | "critical" {
  if (priority === "urgente") return "critical"
  if (priority === "alta") return "warning"
  return "optimal"
}
function priorityLabel(priority: string): string {
  if (priority === "urgente") return "Urgente"
  if (priority === "alta") return "Alta"
  if (priority === "baixa") return "Baixa"
  return "Normal"
}

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStart = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-01`
  const prevMonthEnd = monthStart

  const [
    { data: todayPayments },
    { data: monthPayments },
    { data: recentPayments },
    { count: openOsCount },
    { data: lowStockProducts },
    { count: customerCount },
    { count: waitingApprovalCount },
    { count: completedTodayCount },
    { data: recentOs },
    { data: recentSales },
    { data: thirtyDayPayments },
    { data: sevenDayOsCreated },
    { data: monthSales },
    { data: monthOs },
    { data: prevMonthPayments },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed")
      .eq("company_id", cid)
      .gte("paid_at", todayStr),
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed")
      .eq("company_id", cid)
      .gte("paid_at", monthStart),
    supabase
      .from("payments")
      .select("id, amount, method, paid_at, sale_id, service_order_id, service_orders(order_number, customers(name)), sales(sale_number, customers(name))")
      .eq("company_id", cid)
      .order("paid_at", { ascending: false })
      .limit(8),
    supabase
      .from("service_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cid)
      .is("delivered_at", null),
    supabase
      .from("products")
      .select("stock_quantity, minimum_stock")
      .eq("company_id", cid)
      .eq("status", "active"),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cid),
    supabase
      .from("service_orders")
      .select("id, service_order_statuses!inner(slug)", { count: "exact", head: true })
      .eq("company_id", cid)
      .eq("service_order_statuses.slug", "aguardando-aprovacao"),
    supabase
      .from("service_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cid)
      .gte("completed_at", todayStr),
    supabase
      .from("service_orders")
      .select("id, order_number, priority, reported_problem, created_at, customers(name), service_order_statuses(name, color)")
      .eq("company_id", cid)
      .is("delivered_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("sales")
      .select("id, sale_number, total, created_at, customers(name)")
      .eq("company_id", cid)
      .eq("status", "concluida")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed, paid_at")
      .eq("company_id", cid)
      .gte("paid_at", thirtyDaysAgoStr),
    supabase
      .from("service_orders")
      .select("created_at")
      .eq("company_id", cid)
      .gte("created_at", sevenDaysAgoStr),
    supabase
      .from("sales")
      .select("customer_id")
      .eq("company_id", cid)
      .eq("status", "concluida")
      .gte("created_at", monthStart)
      .not("customer_id", "is", null),
    supabase
      .from("service_orders")
      .select("customer_id")
      .eq("company_id", cid)
      .gte("created_at", monthStart)
      .not("customer_id", "is", null),
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed")
      .eq("company_id", cid)
      .gte("paid_at", prevMonthStart)
      .lt("paid_at", prevMonthEnd),
  ])

  const netAmount = (p: any) => (p.amount ?? 0) - ((p as any).fee_absorbed ? ((p as any).fee_amount ?? 0) : 0)
  const todayRevenue = (todayPayments ?? []).reduce((s, p) => s + netAmount(p), 0)
  const monthRevenue = (monthPayments ?? []).reduce((s, p) => s + netAmount(p), 0)
  const prevMonthRevenue = (prevMonthPayments ?? []).reduce((s, p) => s + netAmount(p), 0)
  const lowStockCount = (lowStockProducts ?? []).filter(
    (p) => p.stock_quantity <= p.minimum_stock
  ).length

  const monthCustomerIds = new Set<string>([
    ...(monthSales ?? []).map((s: any) => s.customer_id as string),
    ...(monthOs ?? []).map((o: any) => o.customer_id as string),
  ])

  const revenue30d = bucketByDay(thirtyDayPayments ?? [], (p: any) => p.paid_at, (p) => netAmount(p), 30, now)
  const revenue7d = revenue30d.slice(-7)
  const osCreated7d = bucketByDay(sevenDayOsCreated ?? [], (o: any) => o.created_at, () => 1, 7, now)

  const sortedRecentOs = [...(recentOs ?? [])]
    .sort((a: any, b: any) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Dashboard" description="Visão geral da sua loja" />
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/oficina/nova">
              <Plus className="size-3.5 mr-1" /> Nova OS
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/vendas/nova">
              <Plus className="size-3.5 mr-1" /> Nova Venda
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/clientes/novo">
              <Plus className="size-3.5 mr-1" /> Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Bento hero: 4 KPIs principais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-2">
        <div className="col-span-2 row-span-2 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3),0_0_24px_var(--brand-teal-glow)]">
          <Gauge
            value={monthRevenue}
            target={prevMonthRevenue}
            format="currency"
            label="Faturamento do Mês"
          />
        </div>
        <KpiTile
          title="OS Abertas"
          numericValue={openOsCount ?? 0}
          icon={<Wrench />}
          href="/oficina"
          sparkline={osCreated7d.map((d) => d.total)}
        />
        <div className="group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
          <Link href="/estoque" className="absolute inset-0 z-10" aria-label="Ver estoque baixo">
            <span className="sr-only">Ver estoque baixo</span>
          </Link>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estoque Baixo
            </p>
            <AlertTriangle className="size-5 shrink-0 text-brand-teal" aria-hidden="true" />
          </div>
          <p className="font-mono text-2xl font-medium tabular-nums text-foreground">
            {lowStockCount}
          </p>
          <ZoneBar
            value={lowStockCount}
            max={(lowStockProducts ?? []).length}
            label={`${(lowStockProducts ?? []).length > 0 ? Math.round((lowStockCount / (lowStockProducts ?? []).length) * 100) : 0}% do catálogo`}
          />
        </div>
        <KpiTile
          title="Clientes Atendidos no Mês"
          numericValue={monthCustomerIds.size}
          icon={<Users />}
          href="/clientes"
        />
      </div>

      {/* Gráfico de faturamento + OS recentes priorizadas */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="border-border/60 shadow-xs lg:col-span-8">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Faturamento — últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <RevenueChart data={revenue30d} />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">OS recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
              <Link href="/oficina" className="flex items-center gap-1">
                Ver todas <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {sortedRecentOs.length === 0 ? (
              <EmptyState icon={Wrench} title="Nenhuma OS aberta" description="Crie uma para acompanhar diagnóstico e manutenção." className="py-10" />
            ) : (
              <div className="divide-y divide-border/60">
                {sortedRecentOs.map((os: any) => (
                  <Link key={os.id} href={`/oficina/${os.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-medium">{os.order_number}</span>
                        {os.service_order_statuses && (
                          <StatusBadge label={os.service_order_statuses.name} color={os.service_order_statuses.color} />
                        )}
                        {(os.priority === "urgente" || os.priority === "alta") && (
                          <StatusPill zone={priorityZone(os.priority)} label={priorityLabel(os.priority)} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {os.customers?.name}{os.reported_problem && ` — ${os.reported_problem.slice(0, 40)}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-3 shrink-0 tabular-nums">{fmtDate(os.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas vendas + métricas secundárias compactas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Últimas vendas</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
              <Link href="/vendas" className="flex items-center gap-1">
                Ver todas <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {(!recentSales || recentSales.length === 0) ? (
              <EmptyState icon={ShoppingCart} title="Nenhuma venda realizada" description="Registre vendas para acompanhar seu faturamento aqui." className="py-10" />
            ) : (
              <div className="divide-y divide-border/60">
                {recentSales.map((s: any) => (
                  <Link key={s.id} href={`/vendas/${s.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{s.sale_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.customers?.name ?? "Venda sem cliente"}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-mono text-sm font-semibold text-emerald-600 tabular-nums">{fmt(s.total)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{fmtDate(s.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Resumo do dia</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-2">
            <MetricChip label="Faturado hoje" value={fmt(todayRevenue)} icon={DollarSign} href="/relatorios" tone={todayRevenue > 0 ? "positive" : "default"} />
            <MetricChip label="Total de clientes" value={String(customerCount ?? 0)} icon={Users} href="/clientes" />
            <MetricChip label="Aguard. aprovação" value={String(waitingApprovalCount ?? 0)} icon={Clock} href="/oficina" tone={waitingApprovalCount ? "negative" : "default"} />
            <MetricChip label="OS concluídas hoje" value={String(completedTodayCount ?? 0)} icon={CheckCircle} href="/oficina" tone="positive" />
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <div>
            <CardTitle className="text-base font-semibold font-display">Pagamentos recentes</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos recebimentos registrados</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
            <Link href="/relatorios" className="flex items-center gap-1">
              Ver relatórios <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {(!recentPayments || recentPayments.length === 0) ? (
            <EmptyState icon={CreditCard} title="Nenhum pagamento registrado" description="Os pagamentos de OS e vendas aparecerão aqui." className="py-10" />
          ) : (
            <div className="divide-y divide-border/60">
              {recentPayments.map((p: any) => {
                const os = p.service_orders
                const sale = p.sales
                const isOs = !!p.service_order_id
                const customerName = isOs ? os?.customers?.name : sale?.customers?.name
                const ref = isOs ? os?.order_number : sale?.sale_number
                const href = isOs ? `/oficina/${p.service_order_id}` : `/vendas/${p.sale_id}`
                const Icon = methodIcon(p.method)
                return (
                  <Link
                    key={p.id}
                    href={href ?? "#"}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {customerName ?? "—"}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 shrink-0",
                            isOs && "bg-brand-violet/15 text-brand-violet"
                          )}
                        >
                          {isOs ? "OS" : "Venda"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ref && `${ref} · `}{METHOD_LABELS[p.method] ?? p.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold text-emerald-600 tabular-nums">
                        {fmt(p.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {fmtDateTime(p.paid_at)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
