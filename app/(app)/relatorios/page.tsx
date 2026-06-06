import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { RelatoriosClient } from "@/components/reports/relatorios-client"

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
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).toISOString().slice(0, 10)

  const [
    { data: salesData },
    { data: osData },
    { data: topProducts },
  ] = await Promise.all([
    supabase.from("sales")
      .select("total, created_at, status")
      .eq("company_id", cid)
      .eq("status", "concluida")
      .gte("created_at", startDate)
      .order("created_at"),
    supabase.from("service_orders")
      .select("total, created_at, service_order_statuses(name, is_final)")
      .eq("company_id", cid)
      .gte("created_at", startDate)
      .order("created_at"),
    supabase.from("sale_items")
      .select("quantity, total, products(name)")
      .eq("company_id", cid)
      .gte("created_at", startDate),
  ])

  // Aggregate by month
  const monthMap: Record<string, { mes: string; vendas: number; os: number }> = {}
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    monthMap[key] = { mes: label, vendas: 0, os: 0 }
  }

  for (const s of (salesData ?? [])) {
    const key = s.created_at.slice(0, 7)
    if (monthMap[key]) monthMap[key].vendas += s.total
  }
  for (const o of (osData ?? [])) {
    const key = o.created_at.slice(0, 7)
    if (monthMap[key]) monthMap[key].os += o.total ?? 0
  }
  const chartData = Object.values(monthMap)

  // Top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const item of (topProducts ?? [])) {
    const name = (item as any).products?.name ?? "Desconhecido"
    if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 }
    productMap[name].qty += item.quantity
    productMap[name].revenue += item.total
  }
  const topProductsData = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const totalVendas = (salesData ?? []).reduce((s, v) => s + v.total, 0)
  const totalOs = (osData ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const totalOrders = (salesData ?? []).length
  const totalOsCount = (osData ?? []).length

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Visão analítica do seu negócio." />
      <RelatoriosClient
        chartData={chartData}
        topProducts={topProductsData}
        totalVendas={totalVendas}
        totalOs={totalOs}
        totalOrders={totalOrders}
        totalOsCount={totalOsCount}
        periodoMeses={months}
      />
    </div>
  )
}
