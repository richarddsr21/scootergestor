import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { ExportCustomer } from "@/lib/actions/customers"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

const N = "#0f172a"
const M = "#64748b"
const L = "#84cc16"
const B = "#e2e8f0"
const G = "#f8fafc"
const W = "#ffffff"

const s = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 9, color: N, padding: 36, backgroundColor: W },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: N },
  brand:       { fontSize: 16, fontFamily: "Helvetica-Bold", color: N },
  brandSub:    { fontSize: 8, color: M, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: N },
  headerSub:   { fontSize: 8, color: M, marginTop: 2 },
  limeBar:     { width: 36, height: 3, backgroundColor: L, marginTop: 6 },
  // summary cards
  kpiRow:      { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpiBox:      { flex: 1, borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
  kpiLabel:    { fontSize: 7, color: M, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  kpiValue:    { fontSize: 16, fontFamily: "Helvetica-Bold", color: N },
  kpiAccent:   { width: 20, height: 2, backgroundColor: L, marginTop: 5 },
  // section
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: N, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: B },
  // table
  tHead:       { flexDirection: "row", backgroundColor: N, borderRadius: 3 },
  tHC:         { color: W, fontSize: 7, fontFamily: "Helvetica-Bold", padding: "5 6" },
  tRow:        { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: B },
  tRowAlt:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: B, backgroundColor: G },
  tC:          { fontSize: 7.5, padding: "4 6", color: N },
  tCM:         { fontSize: 7.5, padding: "4 6", color: M },
  tCR:         { fontSize: 7.5, padding: "4 6", color: N, textAlign: "right" },
  tCG:         { fontSize: 7.5, padding: "4 6", color: "#16a34a", fontFamily: "Helvetica-Bold", textAlign: "right" },
  // footer
  footer:      { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: B, paddingTop: 6 },
  footerText:  { fontSize: 7, color: M },
})

interface Props {
  customers: ExportCustomer[]
  companyName: string
}

// Split into chunks of 30 rows per page
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export function ClientesPDF({ customers, companyName }: Props) {
  const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const totalPago = customers.reduce((s, c) => s + c.total_pago, 0)
  const totalOs = customers.reduce((s, c) => s + c.os_count, 0)
  const comOs = customers.filter((c) => c.os_count > 0).length
  const pages = chunk(customers, 28)

  return (
    <Document>
      {pages.map((pageCustomers, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="landscape" style={s.page}>

          {/* Header — first page only */}
          {pageIdx === 0 && (
            <>
              <View style={s.header}>
                <View>
                  <Text style={s.brand}>{companyName}</Text>
                  <Text style={s.brandSub}>Sistema de Gestão — ScooterGestor</Text>
                </View>
                <View style={s.headerRight}>
                  <Text style={s.headerTitle}>Relatório de Clientes</Text>
                  <Text style={s.headerSub}>{customers.length} clientes cadastrados</Text>
                  <Text style={s.headerSub}>Gerado em {gerado}</Text>
                  <View style={s.limeBar} />
                </View>
              </View>

              {/* Summary */}
              <View style={s.kpiRow}>
                {[
                  { label: "Total de Clientes",   value: String(customers.length) },
                  { label: "Com OS registradas",   value: String(comOs) },
                  { label: "Total de OS",          value: String(totalOs) },
                  { label: "Total Recebido",       value: fmt(totalPago) },
                  { label: "Ticket Médio/Cliente", value: customers.length > 0 ? fmt(totalPago / customers.length) : "R$ 0,00" },
                ].map((k) => (
                  <View key={k.label} style={s.kpiBox}>
                    <Text style={s.kpiLabel}>{k.label}</Text>
                    <Text style={s.kpiValue}>{k.value}</Text>
                    <View style={s.kpiAccent} />
                  </View>
                ))}
              </View>

              <Text style={[s.sectionTitle, { marginBottom: 8 }]}>Lista de Clientes</Text>
            </>
          )}

          {/* Table */}
          <View>
            <View style={s.tHead}>
              <Text style={[s.tHC, { flex: 2.5 }]}>Nome</Text>
              <Text style={[s.tHC, { flex: 1.5 }]}>Telefone</Text>
              <Text style={[s.tHC, { flex: 2 }]}>E-mail</Text>
              <Text style={[s.tHC, { flex: 1.5 }]}>CPF/CNPJ</Text>
              <Text style={[s.tHC, { flex: 1.5 }]}>Cidade/UF</Text>
              <Text style={[s.tHC, { flex: 0.7, textAlign: "right" }]}>OS</Text>
              <Text style={[s.tHC, { flex: 1.5, textAlign: "right" }]}>Total Pago</Text>
              <Text style={[s.tHC, { flex: 1.2, textAlign: "right" }]}>Cadastro</Text>
            </View>

            {pageCustomers.map((c, i) => (
              <View key={c.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.tC, { flex: 2.5 }]}>{c.name}</Text>
                <Text style={[s.tCM, { flex: 1.5 }]}>{c.whatsapp ?? c.phone ?? "—"}</Text>
                <Text style={[s.tCM, { flex: 2 }]}>{c.email ?? "—"}</Text>
                <Text style={[s.tCM, { flex: 1.5 }]}>{c.cpf_cnpj ?? "—"}</Text>
                <Text style={[s.tCM, { flex: 1.5 }]}>
                  {[c.city, c.state].filter(Boolean).join("/") || "—"}
                </Text>
                <Text style={[s.tCR, { flex: 0.7 }]}>{c.os_count}</Text>
                <Text style={[s.tCG, { flex: 1.5 }]}>{c.total_pago > 0 ? fmt(c.total_pago) : "—"}</Text>
                <Text style={[s.tCM, { flex: 1.2, textAlign: "right" }]}>{fmtDate(c.created_at)}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={s.footer} fixed>
            <Text style={s.footerText}>{companyName} — Relatório de Clientes</Text>
            <Text
              style={s.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ))}
    </Document>
  )
}
