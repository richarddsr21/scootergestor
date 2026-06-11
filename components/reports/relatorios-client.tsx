"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts"
import {
  DollarSign, ShoppingCart, Wrench, TrendingUp,
  Users, AlertCircle, CheckCircle2, Clock, Activity,
  FileDown, Sheet, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtK(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$${(n / 1_000).toFixed(0)}k`
  return `R$${n.toFixed(0)}`
}
function pct(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

// ─── types ────────────────────────────────────────────────────────────────────

interface MethodEntry {
  method: string
  label: string
  count: number
  total: number
  color: string
}

interface Props {
  periodoMeses: number
  companyName: string
  totalPago: number
  totalVendasPago: number
  totalOsPago: number
  totalPendente: number
  ticketMedio: number
  clientesUnicos: number
  chartData: { mes: string; os: number; vendas: number }[]
  methodData: MethodEntry[]
  topClients: { name: string; total: number; count: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  osSaude: {
    total: number
    pagas: number
    parciais: number
    pendentes: number
    concluidas: number
    taxaConclusao: number
  }
}

// ─── mini progress bar ────────────────────────────────────────────────────────

function Bar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

// ─── custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background shadow-lg px-3 py-2.5 text-sm">
      <p className="font-medium mb-1.5 text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function RelatoriosClient({
  periodoMeses,
  companyName,
  totalPago,
  totalVendasPago,
  totalOsPago,
  totalPendente,
  ticketMedio,
  clientesUnicos,
  chartData,
  methodData,
  topClients,
  topProducts,
  osSaude,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  function buildUrl(p: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("periodo", p)
    return `${pathname}?${params.toString()}`
  }

  async function handleDownloadPdf() {
    setLoadingPdf(true)
    try {
      const [{ pdf }, { RelatorioPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./relatorio-pdf"),
      ])
      const blob = await pdf(
        RelatorioPDF({
          periodoMeses, companyName, totalPago, totalVendasPago, totalOsPago,
          totalPendente, ticketMedio, clientesUnicos, chartData,
          methodData: methodData.map(({ label, count, total }) => ({ label, count, total })),
          topClients, topProducts, osSaude,
        })
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-${periodoMeses}meses.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error("Erro ao gerar PDF")
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleDownloadXlsx() {
    setLoadingXlsx(true)
    try {
      const [{ default: ExcelJS }, { C, FMT, banner, section, kpiGrid, table, drow, hdr }] = await Promise.all([
        import("exceljs"),
        import("@/lib/xl"),
      ])

      const wb = new ExcelJS.Workbook()
      wb.creator = companyName
      wb.created = new Date()
      const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

      // ── Aba 1: Resumo ─────────────────────────────────────────────────────
      const wsR = wb.addWorksheet("Resumo")
      wsR.columns = [
        { width: 22 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 18 }, { width: 20 },
      ]

      banner(wsR, `${companyName} — Relatório Financeiro`, 6)
      banner(wsR, `Período: últimos ${periodoMeses} meses  ·  Gerado em ${gerado}`, 6, {
        height: 20, size: 9, bold: false, color: C.lime,
      })

      section(wsR, "FATURAMENTO", 6)
      kpiGrid(wsR, [
        { label: "FATURAMENTO TOTAL",  value: totalPago,       fmt: FMT.brl, color: C.green },
        { label: "RECEITA DE VENDAS",  value: totalVendasPago, fmt: FMT.brl, color: C.green },
        { label: "RECEITA DE OS",      value: totalOsPago,     fmt: FMT.brl, color: C.green },
        { label: "TICKET MÉDIO",       value: ticketMedio,     fmt: FMT.brl, color: C.green },
        { label: "CLIENTES ÚNICOS",    value: clientesUnicos },
        { label: "A RECEBER",          value: totalPendente,   fmt: FMT.brl, color: totalPendente > 0 ? C.red : C.green },
      ], 6)

      section(wsR, "RECEITA POR MÊS", 6)
      const nmR = 4
      const mHeader = wsR.addRow(["Mês", "OS (R$)", "Vendas (R$)", "Total (R$)"])
      hdr(mHeader, nmR)
      mHeader.getCell(2).alignment = { horizontal: "right", vertical: "middle" }
      mHeader.getCell(3).alignment = { horizontal: "right", vertical: "middle" }
      mHeader.getCell(4).alignment = { horizontal: "right", vertical: "middle" }
      chartData.forEach((r, i) => {
        const row = wsR.addRow([r.mes, r.os, r.vendas, r.os + r.vendas])
        drow(row, i, nmR)
        for (let j = 2; j <= 4; j++) {
          row.getCell(j).numFmt = FMT.brl
          row.getCell(j).alignment = { horizontal: "right", vertical: "middle" }
        }
        row.getCell(4).font = { name: "Calibri", size: 9, color: { argb: C.green }, bold: true }
      })

      section(wsR, "FORMAS DE PAGAMENTO", 6)
      const nfR = 4
      const fHeader = wsR.addRow(["Forma de Pagamento", "Transações", "Total (R$)", "% do Total"])
      hdr(fHeader, nfR)
      fHeader.getCell(2).alignment = { horizontal: "center", vertical: "middle" }
      fHeader.getCell(3).alignment = { horizontal: "right",  vertical: "middle" }
      fHeader.getCell(4).alignment = { horizontal: "center", vertical: "middle" }
      methodData.forEach((m, i) => {
        const row = wsR.addRow([m.label, m.count, m.total, totalPago > 0 ? m.total / totalPago : 0])
        drow(row, i, nfR)
        row.getCell(2).alignment = { horizontal: "center", vertical: "middle" }
        row.getCell(3).numFmt = FMT.brl
        row.getCell(3).alignment = { horizontal: "right", vertical: "middle" }
        row.getCell(3).font = { name: "Calibri", size: 9, color: { argb: C.green }, bold: true }
        row.getCell(4).numFmt = '0.0"%"'
        row.getCell(4).alignment = { horizontal: "center", vertical: "middle" }
      })

      // ── Aba 2: Top Clientes ───────────────────────────────────────────────
      if (topClients.length > 0) {
        const wsTC = wb.addWorksheet("Top Clientes")
        table(wsTC, [
          { header: "#",           key: "rank",  width: 5,  align: "center" },
          { header: "Cliente",     key: "name",  width: 36 },
          { header: "Transações",  key: "count", width: 13, align: "center", fmt: FMT.int },
          { header: "Total Pago",  key: "total", width: 18, align: "right",  fmt: FMT.brl, color: C.green },
        ], topClients.map((c, i) => ({ rank: i + 1, name: c.name, count: c.count, total: c.total })))
      }

      // ── Aba 3: Top Produtos ───────────────────────────────────────────────
      if (topProducts.length > 0) {
        const wsTP = wb.addWorksheet("Top Produtos")
        table(wsTP, [
          { header: "#",             key: "rank",    width: 5,  align: "center" },
          { header: "Produto",       key: "name",    width: 36 },
          { header: "Qtd Vendida",   key: "qty",     width: 13, align: "center", fmt: FMT.int },
          { header: "Faturamento",   key: "revenue", width: 18, align: "right",  fmt: FMT.brl, color: C.green },
        ], topProducts.map((p, i) => ({ rank: i + 1, name: p.name, qty: p.qty, revenue: p.revenue })))
      }

      // ── Aba 4: Saúde das OS ───────────────────────────────────────────────
      const wsSaude = wb.addWorksheet("Saúde das OS")
      wsSaude.columns = [{ width: 26 }, { width: 16 }, { width: 16 }]

      banner(wsSaude, "Saúde das Ordens de Serviço", 3)
      banner(wsSaude, `Período: últimos ${periodoMeses} meses`, 3, { height: 20, size: 9, bold: false, color: C.lime })

      section(wsSaude, "INDICADORES", 3)
      const saude = [
        { label: "Total de OS",       value: osSaude.total,       color: C.navy },
        { label: "OS Pagas",          value: osSaude.pagas,       color: C.green },
        { label: "OS Parciais",       value: osSaude.parciais,    color: C.yellow },
        { label: "OS Pendentes",      value: osSaude.pendentes,   color: C.red },
        { label: "OS Concluídas",     value: osSaude.concluidas,  color: C.green },
        { label: "Taxa de Conclusão", value: osSaude.taxaConclusao / 100, color: C.green, fmt: '0.0"%"' },
      ]

      const sSH = wsSaude.addRow(["Indicador", "Valor", "Status"])
      hdr(sSH, 3)
      sSH.getCell(2).alignment = { horizontal: "right", vertical: "middle" }
      sSH.getCell(3).alignment = { horizontal: "center", vertical: "middle" }

      saude.forEach((s, i) => {
        const pct = osSaude.total > 0 ? Math.round((Number(s.value) / osSaude.total) * 100) : 0
        const row = wsSaude.addRow([s.label, s.value, s.label.includes("Taxa") ? "—" : `${pct}%`])
        drow(row, i, 3)
        const vc = row.getCell(2)
        if (s.fmt) vc.numFmt = s.fmt
        vc.alignment = { horizontal: "right", vertical: "middle" }
        vc.font = { name: "Calibri", size: 9, color: { argb: s.color }, bold: true }
        row.getCell(3).alignment = { horizontal: "center", vertical: "middle" }
      })

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-${periodoMeses}meses.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      toast.error("Erro ao gerar Excel")
    } finally {
      setLoadingXlsx(false)
    }
  }

  const PERIODOS = [
    { value: "3", label: "3 meses" },
    { value: "6", label: "6 meses" },
    { value: "12", label: "12 meses" },
  ]

  const kpis = [
    {
      label: "Faturamento Total",
      value: fmt(totalPago),
      sub: `${periodoMeses} meses`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Receita de Vendas",
      value: fmt(totalVendasPago),
      sub: `${pct(totalVendasPago, totalPago)}% do total`,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      label: "Receita de OS",
      value: fmt(totalOsPago),
      sub: `${pct(totalOsPago, totalPago)}% do total`,
      icon: Wrench,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
    },
    {
      label: "Ticket Médio",
      value: fmt(ticketMedio),
      sub: "por pagamento",
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Clientes Únicos",
      value: String(clientesUnicos),
      sub: "com pagamentos",
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-500/10",
    },
    {
      label: "A Receber",
      value: fmt(totalPendente),
      sub: "OS não pagas",
      icon: AlertCircle,
      color: totalPendente > 0 ? "text-red-600" : "text-muted-foreground",
      bg: totalPendente > 0 ? "bg-red-500/10" : "bg-muted",
    },
  ]

  const topClientMax = topClients[0]?.total ?? 1
  const topProductMax = topProducts[0]?.revenue ?? 1

  return (
    <div className="space-y-6">

      {/* Period filter + download buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {PERIODOS.map((p) => (
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

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadXlsx}
            disabled={loadingXlsx}
            className="gap-1.5"
          >
            {loadingXlsx
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Sheet className="size-3.5" />}
            Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="gap-1.5"
          >
            {loadingPdf
              ? <Loader2 className="size-3.5 animate-spin" />
              : <FileDown className="size-3.5" />}
            PDF
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
                    {k.label}
                  </span>
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${k.bg}`}>
                    <Icon className={`size-3.5 ${k.color}`} />
                  </span>
                </div>
                <p className={`font-display font-bold text-xl leading-none tabular-nums ${k.color}`}>
                  {k.value}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{k.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue evolution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Evolução de Receita</CardTitle>
          <p className="text-xs text-muted-foreground">Pagamentos recebidos por mês — Vendas vs Oficina</p>
        </CardHeader>
        <CardContent>
          {chartData.every((d) => d.os === 0 && d.vendas === 0) ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Nenhum pagamento registrado no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tickFormatter={fmtK}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                />
                <Line
                  dataKey="os"
                  name="Oficina (OS)"
                  stroke="#84cc16"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#84cc16", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  dataKey="vendas"
                  name="Vendas"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment methods */}
      {methodData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por Forma de Pagamento</CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição de receita por método</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 items-center">
              {/* Donut */}
              <div className="relative mx-auto w-full max-w-[260px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={methodData}
                      dataKey="total"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {methodData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(Number(v))}
                      contentStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
                  <span className="text-base font-display font-bold tabular-nums">{fmtK(totalPago)}</span>
                </div>
              </div>

              {/* Table */}
              <div className="space-y-1">
                {methodData.map((m) => (
                  <div key={m.method} className="flex items-center gap-3 py-1.5">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: m.color }}
                    />
                    <span className="flex-1 text-sm truncate">{m.label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {m.count}x
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                      {pct(m.total, totalPago)}%
                    </span>
                    <span className="text-sm font-semibold tabular-nums w-28 text-right">
                      {fmt(m.total)}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center gap-3 py-1">
                  <span className="size-2.5 shrink-0" />
                  <span className="flex-1 text-sm font-semibold">Total</span>
                  <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                    {methodData.reduce((s, m) => s + m.count, 0)}x
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    100%
                  </span>
                  <span className="text-sm font-bold tabular-nums w-28 text-right text-emerald-600">
                    {fmt(totalPago)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top clients + Top products — side by side */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Top clients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top 10 Clientes</CardTitle>
            <p className="text-xs text-muted-foreground">Por receita total no período</p>
          </CardHeader>
          <CardContent className="p-0">
            {topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground px-5 py-8 text-center">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="divide-y">
                {topClients.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <div className="mt-1">
                        <Bar value={c.total} max={topClientMax} color="bg-primary" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-emerald-600">
                        {fmt(c.total)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{c.count} pgto{c.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top 10 Produtos</CardTitle>
            <p className="text-xs text-muted-foreground">Por faturamento em vendas</p>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground px-5 py-8 text-center">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="divide-y">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="mt-1">
                        <Bar value={p.revenue} max={topProductMax} color="bg-blue-500" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-emerald-600">
                        {fmt(p.revenue)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{p.qty} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OS Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Saúde das Ordens de Serviço</CardTitle>
          <p className="text-xs text-muted-foreground">Status de pagamento e conclusão no período</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-xl border p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total OS</span>
              </div>
              <p className="font-display font-bold text-2xl">{osSaude.total}</p>
              <p className="text-xs text-muted-foreground">no período</p>
            </div>

            <div className="rounded-xl border p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Pagas</span>
              </div>
              <p className="font-display font-bold text-2xl text-emerald-600">{osSaude.pagas}</p>
              <p className="text-xs text-muted-foreground">
                {pct(osSaude.pagas, osSaude.total)}% do total
              </p>
            </div>

            <div className="rounded-xl border p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="size-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Parciais</span>
              </div>
              <p className="font-display font-bold text-2xl text-amber-600">{osSaude.parciais}</p>
              <p className="text-xs text-muted-foreground">
                {pct(osSaude.parciais, osSaude.total)}% do total
              </p>
            </div>

            <div className="rounded-xl border p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Pendentes</span>
              </div>
              <p className="font-display font-bold text-2xl text-red-600">{osSaude.pendentes}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(osSaude.pendentes > 0 ? 0 : 0)} a receber
              </p>
            </div>

            <div className="rounded-xl border p-4 space-y-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">Conclusão</span>
              </div>
              <p className="font-display font-bold text-2xl text-primary">
                {osSaude.taxaConclusao}%
              </p>
              <div className="pt-1">
                <Bar
                  value={osSaude.concluidas}
                  max={osSaude.total || 1}
                  color="bg-primary"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {osSaude.concluidas}/{osSaude.total} concluídas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
