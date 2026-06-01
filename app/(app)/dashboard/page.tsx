import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { MetricCard } from "@/components/shared/metric-card"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

  const [
    { data: todaySales },
    { data: monthSales },
    { count: openOsCount },
    { data: lowStockProducts },
    { count: customerCount },
    { data: pendingApprovalOs },
    { data: recentOs },
    { data: recentSales },
  ] = await Promise.all([
    supabase.from("sales").select("total").eq("company_id", cid).eq("status", "concluida").gte("created_at", todayStr),
    supabase.from("sales").select("total").eq("company_id", cid).eq("status", "concluida").gte("created_at", monthStart),
    supabase.from("service_orders").select("*", { count: "exact", head: true }).eq("company_id", cid)
      .is("delivered_at", null),
    supabase.from("products").select("stock_quantity, minimum_stock").eq("company_id", cid)
      .eq("status", "active"),
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("company_id", cid),
    supabase.from("service_order_statuses").select("id").eq("company_id", cid)
      .eq("slug", "aguardando-aprovacao"),
    supabase.from("service_orders").select("id, order_number, priority, reported_problem, created_at, customers(name), service_order_statuses(name, color)")
      .eq("company_id", cid).is("delivered_at", null).order("created_at", { ascending: false }).limit(5),
    supabase.from("sales").select("id, sale_number, total, created_at, customers(name)").eq("company_id", cid)
      .eq("status", "concluida").order("created_at", { ascending: false }).limit(5),
  ])

  const todayRevenue = (todaySales ?? []).reduce((s, r) => s + r.total, 0)
  const monthRevenue = (monthSales ?? []).reduce((s, r) => s + r.total, 0)
  const lowStockCount = (lowStockProducts ?? []).filter(p => p.stock_quantity <= p.minimum_stock).length

  let waitingApprovalCount = 0
  if (pendingApprovalOs && pendingApprovalOs.length > 0) {
    const { count } = await supabase.from("service_orders").select("*", { count: "exact", head: true })
      .eq("company_id", cid).eq("status_id", pendingApprovalOs[0].id)
    waitingApprovalCount = count ?? 0
  }

  const cards = [
    {
      title: "Faturamento Hoje",
      value: fmt(todayRevenue),
      icon: DollarSign,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
      trend: "receita do dia",
      trendPositive: todayRevenue > 0,
      href: "/financeiro",
    },
    {
      title: "Faturamento do Mês",
      value: fmt(monthRevenue),
      icon: TrendingUp,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50 dark:bg-blue-950/30",
      href: "/financeiro",
    },
    {
      title: "OS Abertas",
      value: String(openOsCount ?? 0),
      icon: Wrench,
      colorClass: "text-orange-600",
      bgClass: "bg-orange-50 dark:bg-orange-950/30",
      trend: openOsCount ? "em andamento" : undefined,
      href: "/oficina",
    },
    {
      title: "Estoque Baixo",
      value: String(lowStockCount ?? 0),
      icon: AlertTriangle,
      colorClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/30",
      trend: lowStockCount ? "itens críticos" : undefined,
      trendPositive: false,
      href: "/estoque",
    },
    {
      title: "Vendas do Mês",
      value: String((monthSales ?? []).length),
      icon: ShoppingCart,
      colorClass: "text-violet-600",
      bgClass: "bg-violet-50 dark:bg-violet-950/30",
      href: "/vendas",
    },
    {
      title: "Total de Clientes",
      value: String(customerCount ?? 0),
      icon: Users,
      colorClass: "text-sky-600",
      bgClass: "bg-sky-50 dark:bg-sky-950/30",
      href: "/clientes",
    },
    {
      title: "Aguard. Aprovação",
      value: String(waitingApprovalCount),
      icon: Clock,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50 dark:bg-amber-950/30",
      trend: waitingApprovalCount ? "requer atenção" : undefined,
      trendPositive: false,
      href: "/oficina",
    },
    {
      title: "OS Finalizadas Hoje",
      value: String((todaySales ?? []).length),
      icon: CheckCircle,
      colorClass: "text-teal-600",
      bgClass: "bg-teal-50 dark:bg-teal-950/30",
      href: "/oficina",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Dashboard"
          description="Visão geral da sua loja"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/oficina/nova">
              <Plus className="size-3.5 mr-1" />
              Nova OS
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/vendas/nova">
              <Plus className="size-3.5 mr-1" />
              Nova Venda
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/clientes/novo">
              <Plus className="size-3.5 mr-1" />
              Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <MetricCard
            key={c.title}
            title={c.title}
            value={c.value}
            icon={c.icon}
            colorClass={c.colorClass}
            bgClass={c.bgClass}
            trend={c.trend}
            trendPositive={c.trendPositive}
            href={c.href}
          />
        ))}
      </div>

      {/* Recent OS + Last Sales */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent OS */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">OS recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
              <Link href="/oficina" className="flex items-center gap-1">
                Ver todas
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {(!recentOs || recentOs.length === 0) ? (
              <EmptyState
                icon={Wrench}
                title="Nenhuma OS aberta"
                description="Crie uma para acompanhar diagnóstico e manutenção."
                className="py-10"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {recentOs.map((os: any) => (
                  <Link
                    key={os.id}
                    href={`/oficina/${os.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {os.order_number}
                        </span>
                        {os.service_order_statuses && (
                          <StatusBadge
                            label={os.service_order_statuses.name}
                            color={os.service_order_statuses.color}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {(os.customers as any)?.name}
                        {os.reported_problem && ` — ${os.reported_problem.slice(0, 40)}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-3 shrink-0 tabular-nums">
                      {fmtDate(os.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Sales */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Últimas vendas</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
              <Link href="/vendas" className="flex items-center gap-1">
                Ver todas
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {(!recentSales || recentSales.length === 0) ? (
              <EmptyState
                icon={ShoppingCart}
                title="Nenhuma venda realizada"
                description="Registre vendas para acompanhar seu faturamento aqui."
                className="py-10"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {recentSales.map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/vendas/${s.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.sale_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(s.customers as any)?.name ?? "Venda sem cliente"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                        {fmt(s.total)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {fmtDate(s.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
