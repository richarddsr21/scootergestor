import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function pct(value: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

// ─── styles ───────────────────────────────────────────────────────────────────

const N = "#0f172a"   // navy dark
const M = "#64748b"   // muted
const L = "#84cc16"   // lime
const B = "#e2e8f0"   // border
const G = "#f8fafc"   // gray bg
const W = "#ffffff"

const s = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 9, color: N, padding: 36, backgroundColor: W },
  // header
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: N },
  brand:        { fontSize: 16, fontFamily: "Helvetica-Bold", color: N, letterSpacing: 0.5 },
  brandSub:     { fontSize: 8, color: M, marginTop: 2 },
  headerRight:  { alignItems: "flex-end" },
  headerTitle:  { fontSize: 11, fontFamily: "Helvetica-Bold", color: N },
  headerSub:    { fontSize: 8, color: M, marginTop: 2 },
  limeBar:      { width: 36, height: 3, backgroundColor: L, marginTop: 6 },
  // section
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: N, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: B },
  // kpi grid
  kpiGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  kpiBox:       { width: "31.5%", borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
  kpiLabel:     { fontSize: 7, color: M, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  kpiValue:     { fontSize: 14, fontFamily: "Helvetica-Bold", color: N },
  kpiSub:       { fontSize: 7, color: M, marginTop: 2 },
  kpiAccent:    { width: 20, height: 2, backgroundColor: L, marginTop: 6 },
  // table
  table:        { width: "100%" },
  tHead:        { flexDirection: "row", backgroundColor: N, borderRadius: 3 },
  tHeadCell:    { color: W, fontSize: 8, fontFamily: "Helvetica-Bold", padding: "6 8", flex: 1 },
  tHeadCellR:   { color: W, fontSize: 8, fontFamily: "Helvetica-Bold", padding: "6 8", flex: 1, textAlign: "right" },
  tRow:         { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: B },
  tRowAlt:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: B, backgroundColor: G },
  tCell:        { fontSize: 8, padding: "5 8", flex: 1, color: N },
  tCellMuted:   { fontSize: 8, padding: "5 8", flex: 1, color: M },
  tCellR:       { fontSize: 8, padding: "5 8", flex: 1, textAlign: "right", color: N },
  tCellGreen:   { fontSize: 8, padding: "5 8", flex: 1, textAlign: "right", color: "#16a34a", fontFamily: "Helvetica-Bold" },
  tFoot:        { flexDirection: "row", backgroundColor: G, borderTopWidth: 2, borderTopColor: N, borderRadius: 3 },
  tFootCell:    { fontSize: 8, fontFamily: "Helvetica-Bold", padding: "6 8", flex: 1, color: N },
  tFootCellR:   { fontSize: 8, fontFamily: "Helvetica-Bold", padding: "6 8", flex: 1, textAlign: "right", color: "#16a34a" },
  // health grid
  healthGrid:   { flexDirection: "row", gap: 6 },
  healthBox:    { flex: 1, borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G, alignItems: "center" },
  healthNum:    { fontSize: 20, fontFamily: "Helvetica-Bold", color: N, marginBottom: 2 },
  healthLabel:  { fontSize: 7, color: M, textTransform: "uppercase", letterSpacing: 0.4 },
  // cols helpers
  col2:         { width: "50%", paddingRight: 6 },
  row2:         { flexDirection: "row" },
  // footer
  footer:       { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: B, paddingTop: 6 },
  footerText:   { fontSize: 7, color: M },
})

// ─── types ────────────────────────────────────────────────────────────────────

export interface RelatorioPdfProps {
  periodoLabel: string
  companyName: string
  totalPago: number
  totalVendasPago: number
  totalOsPago: number
  totalPendente: number
  ticketMedio: number
  clientesUnicos: number
  chartData: { mes: string; os: number; vendas: number }[]
  methodData: { label: string; count: number; total: number }[]
  topClients: { name: string; total: number; count: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  osSaude: {
    total: number; pagas: number; parciais: number
    pendentes: number; concluidas: number; taxaConclusao: number
  }
}

// ─── document ─────────────────────────────────────────────────────────────────

export function RelatorioPDF({
  periodoLabel,
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
}: RelatorioPdfProps) {
  const gerado = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  })

  const kpis = [
    { label: "Faturamento Total",  value: fmt(totalPago),        sub: periodoLabel },
    { label: "Receita de Vendas",  value: fmt(totalVendasPago),   sub: pct(totalVendasPago, totalPago) + " do total" },
    { label: "Receita de OS",      value: fmt(totalOsPago),       sub: pct(totalOsPago, totalPago) + " do total" },
    { label: "Ticket Médio",       value: fmt(ticketMedio),       sub: "por pagamento" },
    { label: "Clientes Únicos",    value: String(clientesUnicos), sub: "com pagamentos" },
    { label: "A Receber (Pend.)",  value: fmt(totalPendente),     sub: "OS não pagas" },
  ]

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{companyName}</Text>
            <Text style={s.brandSub}>Sistema de Gestão — ScooterGestor</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>Relatório Financeiro</Text>
            <Text style={s.headerSub}>Período: {periodoLabel}</Text>
            <Text style={s.headerSub}>Gerado em {gerado}</Text>
            <View style={s.limeBar} />
          </View>
        </View>

        {/* KPIs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumo Financeiro</Text>
          <View style={s.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={s.kpiBox}>
                <Text style={s.kpiLabel}>{k.label}</Text>
                <Text style={s.kpiValue}>{k.value}</Text>
                <Text style={s.kpiSub}>{k.sub}</Text>
                <View style={s.kpiAccent} />
              </View>
            ))}
          </View>
        </View>

        {/* Revenue by month */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Receita por Mês</Text>
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.tHeadCell, { flex: 1.2 }]}>Mês</Text>
              <Text style={s.tHeadCellR}>OS (R$)</Text>
              <Text style={s.tHeadCellR}>Vendas (R$)</Text>
              <Text style={s.tHeadCellR}>Total (R$)</Text>
            </View>
            {chartData.map((row, i) => (
              <View key={row.mes} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.tCell, { flex: 1.2 }]}>{row.mes}</Text>
                <Text style={s.tCellR}>{fmt(row.os)}</Text>
                <Text style={s.tCellR}>{fmt(row.vendas)}</Text>
                <Text style={s.tCellGreen}>{fmt(row.os + row.vendas)}</Text>
              </View>
            ))}
            <View style={s.tFoot}>
              <Text style={[s.tFootCell, { flex: 1.2 }]}>Total</Text>
              <Text style={s.tFootCellR}>{fmt(totalOsPago)}</Text>
              <Text style={s.tFootCellR}>{fmt(totalVendasPago)}</Text>
              <Text style={s.tFootCellR}>{fmt(totalPago)}</Text>
            </View>
          </View>
        </View>

        {/* Methods + OS health — 2 cols */}
        <View style={s.row2}>
          {/* Payment methods */}
          <View style={[s.col2, s.section]}>
            <Text style={s.sectionTitle}>Formas de Pagamento</Text>
            <View style={s.table}>
              <View style={s.tHead}>
                <Text style={[s.tHeadCell, { flex: 2 }]}>Método</Text>
                <Text style={s.tHeadCellR}>Pgtos</Text>
                <Text style={s.tHeadCellR}>Total</Text>
              </View>
              {methodData.map((m, i) => (
                <View key={m.label} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                  <Text style={[s.tCell, { flex: 2 }]}>{m.label}</Text>
                  <Text style={s.tCellR}>{m.count}</Text>
                  <Text style={s.tCellGreen}>{fmt(m.total)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* OS health */}
          <View style={[{ width: "50%", paddingLeft: 6 }, s.section]}>
            <Text style={s.sectionTitle}>Saúde das OS</Text>
            <View style={s.healthGrid}>
              {[
                { num: String(osSaude.total),         label: "Total OS" },
                { num: String(osSaude.pagas),         label: "Pagas" },
                { num: String(osSaude.pendentes),     label: "Pendentes" },
                { num: `${osSaude.taxaConclusao}%`,   label: "Conclusão" },
              ].map((h) => (
                <View key={h.label} style={s.healthBox}>
                  <Text style={s.healthNum}>{h.num}</Text>
                  <Text style={s.healthLabel}>{h.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{companyName} — Relatório Financeiro</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>
      </Page>

      {/* Page 2: Top clients + Top products */}
      <Page size="A4" style={s.page}>

        {/* Header repeat */}
        <View style={[s.header, { marginBottom: 16 }]}>
          <Text style={s.brand}>{companyName}</Text>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>Relatório Financeiro — Rankings</Text>
            <Text style={s.headerSub}>Gerado em {gerado}</Text>
          </View>
        </View>

        {/* Top clients */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top 10 Clientes por Receita</Text>
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.tHeadCell, { width: 24, flex: 0 }]}>#</Text>
              <Text style={[s.tHeadCell, { flex: 3 }]}>Cliente</Text>
              <Text style={s.tHeadCellR}>Pgtos</Text>
              <Text style={s.tHeadCellR}>Total Pago</Text>
            </View>
            {topClients.map((c, i) => (
              <View key={c.name} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.tCellMuted, { width: 24, flex: 0 }]}>{i + 1}</Text>
                <Text style={[s.tCell, { flex: 3 }]}>{c.name}</Text>
                <Text style={s.tCellR}>{c.count}</Text>
                <Text style={s.tCellGreen}>{fmt(c.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top products */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top 10 Produtos por Faturamento</Text>
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.tHeadCell, { width: 24, flex: 0 }]}>#</Text>
              <Text style={[s.tHeadCell, { flex: 3 }]}>Produto</Text>
              <Text style={s.tHeadCellR}>Qtd vendida</Text>
              <Text style={s.tHeadCellR}>Faturamento</Text>
            </View>
            {topProducts.map((p, i) => (
              <View key={p.name} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.tCellMuted, { width: 24, flex: 0 }]}>{i + 1}</Text>
                <Text style={[s.tCell, { flex: 3 }]}>{p.name}</Text>
                <Text style={s.tCellR}>{p.qty}</Text>
                <Text style={s.tCellGreen}>{fmt(p.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{companyName} — Relatório Financeiro</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  )
}
