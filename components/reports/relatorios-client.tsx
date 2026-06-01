"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { DollarSign, ShoppingCart, Wrench, TrendingUp } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtK(n: number) {
  if (n >= 1000) return `R$${(n / 1000).toFixed(1)}k`
  return fmt(n)
}

interface Props {
  chartData: { mes: string; vendas: number; os: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  totalVendas: number
  totalOs: number
  totalOrders: number
  totalOsCount: number
  periodoMeses: number
}

export function RelatoriosClient({
  chartData,
  topProducts,
  totalVendas,
  totalOs,
  totalOrders,
  totalOsCount,
  periodoMeses,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildUrl(periodo: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("periodo", periodo)
    return `${pathname}?${params.toString()}`
  }

  const PERIODOS = [
    { value: "3", label: "3 meses" },
    { value: "6", label: "6 meses" },
    { value: "12", label: "12 meses" },
  ]

  const cards = [
    { title: "Total em vendas", value: fmt(totalVendas), sub: `${totalOrders} vendas`, icon: ShoppingCart, color: "text-blue-600" },
    { title: "Total em OS", value: fmt(totalOs), sub: `${totalOsCount} ordens`, icon: Wrench, color: "text-violet-600" },
    { title: "Faturamento total", value: fmt(totalVendas + totalOs), sub: `${periodoMeses} meses`, icon: TrendingUp, color: "text-emerald-600" },
    { title: "Ticket médio (vendas)", value: totalOrders > 0 ? fmt(totalVendas / totalOrders) : "R$ 0,00", sub: "por venda", icon: DollarSign, color: "text-amber-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {PERIODOS.map(p => (
            <Button
              key={p.value}
              size="sm"
              variant={String(periodoMeses) === p.value ? "default" : "outline"}
              asChild
            >
              <Link href={buildUrl(p.value)}>{p.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title} className="py-4">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Faturamento por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
              <Legend />
              <Bar dataKey="vendas" name="Vendas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="os" name="OS" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {topProducts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Top produtos por faturamento</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Produto</th>
                  <th className="text-right p-3 font-medium">Qtd vendida</th>
                  <th className="text-right p-3 font-medium">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topProducts.map((p, i) => (
                  <tr key={p.name} className="hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                        {p.name}
                      </div>
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{p.qty}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600">{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
