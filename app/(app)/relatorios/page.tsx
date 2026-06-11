import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { RelatoriosClient } from "@/components/reports/relatorios-client"

const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão de Débito", debit_card: "Cartão de Débito",
  cartao_credito: "Cartão de Crédito", credit_card: "Cartão de Crédito",
  boleto: "Boleto", bank_slip: "Boleto",
  payment_link: "Link de Pgto",
  misto: "Misto",
  outro: "Outro",
}
const METHOD_COLORS: Record<string, string> = {
  dinheiro: "#22c55e", cash: "#22c55e",
  pix: "#06b6d4",
  cartao_debito: "#3b82f6", debit_card: "#3b82f6",
  cartao_credito: "#8b5cf6", credit_card: "#8b5cf6",
  boleto: "#f59e0b", bank_slip: "#f59e0b",
  payment_link: "#ec4899",
  misto: "#64748b",
  outro: "#9ca3af",
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo } = await searchParams
  const months = Math.max(1, Math.min(12, Number(periodo ?? "6")))

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    .toISOString()
    .slice(0, 10)

  const [
    { data: paymentsRaw },
    { data: osAll },
    { data: salesData },
    { data: saleItems },
    { data: customers },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount, method, paid_at, sale_id, service_order_id")
      .eq("company_id", cid)
      .gte("paid_at", startDate)
      .order("paid_at"),
    supabase
      .from("service_orders")
      .select("id, total, payment_status, completed_at, created_at, customer_id")
      .eq("company_id", cid)
      .gte("created_at", startDate),
    supabase
      .from("sales")
      .select("id, total, created_at, customer_id")
      .eq("company_id", cid)
      .eq("status", "concluida")
      .gte("created_at", startDate),
    supabase
      .from("sale_items")
      .select("quantity, total, products(name)")
      .eq("company_id", cid)
      .gte("created_at", startDate),
    supabase.from("customers").select("id, name").eq("company_id", cid),
    supabase.from("company_settings").select("business_name").eq("company_id", cid).maybeSingle(),
  ])

  const payments = paymentsRaw ?? []
  const os = osAll ?? []
  const sales = salesData ?? []

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalPago = payments.reduce((s, p) => s + p.amount, 0)
  const totalVendasPago = payments.filter((p) => p.sale_id).reduce((s, p) => s + p.amount, 0)
  const totalOsPago = payments.filter((p) => p.service_order_id).reduce((s, p) => s + p.amount, 0)
  const totalPendente = os
    .filter((o) => o.payment_status !== "pago")
    .reduce((s, o) => s + (o.total ?? 0), 0)
  const ticketMedio = payments.length > 0 ? totalPago / payments.length : 0

  // ── Top clients ─────────────────────────────────────────────────────────────
  const osMap = new Map(os.map((o) => [o.id, o.customer_id]))
  const saleMap = new Map(sales.map((s) => [s.id, s.customer_id]))
  const customerMap = new Map((customers ?? []).map((c) => [c.id, c.name]))
  const clientTotals: Record<string, { name: string; total: number; count: number }> = {}

  for (const p of payments) {
    const cId = p.service_order_id
      ? osMap.get(p.service_order_id)
      : p.sale_id
      ? saleMap.get(p.sale_id)
      : null
    if (!cId) continue
    const name = customerMap.get(cId) ?? "Cliente"
    if (!clientTotals[cId]) clientTotals[cId] = { name, total: 0, count: 0 }
    clientTotals[cId].total += p.amount
    clientTotals[cId].count += 1
  }

  const clientesUnicos = Object.keys(clientTotals).length
  const topClients = Object.values(clientTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // ── Chart: payments by month ────────────────────────────────────────────────
  const monthMap: Record<string, { mes: string; os: number; vendas: number }> = {}
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap[key] = {
      mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      os: 0,
      vendas: 0,
    }
  }
  for (const p of payments) {
    const key = (p.paid_at ?? "").slice(0, 7)
    if (!monthMap[key]) continue
    if (p.service_order_id) monthMap[key].os += p.amount
    else if (p.sale_id) monthMap[key].vendas += p.amount
  }
  const chartData = Object.values(monthMap)

  // ── Payment methods ─────────────────────────────────────────────────────────
  const methodTotals: Record<string, { count: number; total: number }> = {}
  for (const p of payments) {
    if (!methodTotals[p.method]) methodTotals[p.method] = { count: 0, total: 0 }
    methodTotals[p.method].count += 1
    methodTotals[p.method].total += p.amount
  }
  const methodData = Object.entries(methodTotals)
    .map(([method, data]) => ({
      method,
      label: METHOD_LABELS[method] ?? method,
      count: data.count,
      total: data.total,
      color: METHOD_COLORS[method] ?? "#6b7280",
    }))
    .sort((a, b) => b.total - a.total)

  // ── Top products ────────────────────────────────────────────────────────────
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const item of saleItems ?? []) {
    const name = (item as any).products?.name ?? "Desconhecido"
    if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 }
    productMap[name].qty += item.quantity
    productMap[name].revenue += item.total
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // ── OS health ───────────────────────────────────────────────────────────────
  const osSaude = {
    total: os.length,
    pagas: os.filter((o) => o.payment_status === "pago").length,
    parciais: os.filter((o) => o.payment_status === "parcial").length,
    pendentes: os.filter((o) => o.payment_status === "pendente").length,
    concluidas: os.filter((o) => o.completed_at).length,
    taxaConclusao:
      os.length > 0
        ? Math.round((os.filter((o) => o.completed_at).length / os.length) * 100)
        : 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Visão analítica do seu negócio." />
      <RelatoriosClient
        periodoMeses={months}
        companyName={(settings as any)?.business_name ?? "ScooterGestor"}
        totalPago={totalPago}
        totalVendasPago={totalVendasPago}
        totalOsPago={totalOsPago}
        totalPendente={totalPendente}
        ticketMedio={ticketMedio}
        clientesUnicos={clientesUnicos}
        chartData={chartData}
        methodData={methodData}
        topClients={topClients}
        topProducts={topProducts}
        osSaude={osSaude}
      />
    </div>
  )
}
