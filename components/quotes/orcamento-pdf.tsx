import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { OrcamentoExportData } from "@/lib/actions/quotes"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

const ITEM_TYPE_LABELS: Record<string, string> = { scooter: "Scooter", part: "Peça", service: "Serviço", labor: "M.O." }
const STATUS_LABELS: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado", expirado: "Expirado" }
const STATUS_COLORS: Record<string, string> = { pendente: "#f59e0b", aprovado: "#16a34a", rejeitado: "#ef4444", expirado: "#64748b" }

const N = "#0f172a"
const M = "#64748b"
const L = "#84cc16"
const B = "#e2e8f0"
const G = "#f8fafc"
const W = "#ffffff"
const GR = "#16a34a"
const RD = "#ef4444"

const s = StyleSheet.create({
  page:       { fontFamily: "Helvetica", fontSize: 9, color: N, padding: 36, backgroundColor: W },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: N },
  brand:      { fontSize: 15, fontFamily: "Helvetica-Bold", color: N },
  brandSub:   { fontSize: 7.5, color: M, marginTop: 2 },
  hRight:     { alignItems: "flex-end" },
  hTitle:     { fontSize: 13, fontFamily: "Helvetica-Bold", color: N },
  hNum:       { fontSize: 9, color: M, marginTop: 2 },
  limeBar:    { width: 32, height: 3, backgroundColor: L, marginTop: 5 },
  kpiRow:     { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpiBox:     { flex: 1, borderWidth: 1, borderColor: B, borderRadius: 4, padding: 9, backgroundColor: G },
  kpiLabel:   { fontSize: 6.5, color: M, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  kpiValue:   { fontSize: 13, fontFamily: "Helvetica-Bold", color: N },
  kpiAccent:  { width: 18, height: 2, backgroundColor: L, marginTop: 4 },
  secTitle:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: N, marginBottom: 6, marginTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: B },
  row2:       { flexDirection: "row", gap: 12, marginBottom: 12 },
  col:        { flex: 1 },
  infoBox:    { borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
  infoRow:    { flexDirection: "row", marginBottom: 4 },
  infoLabel:  { fontSize: 7.5, color: M, width: 72 },
  infoValue:  { fontSize: 7.5, color: N, flex: 1 },
  infoValueB: { fontSize: 7.5, color: N, flex: 1, fontFamily: "Helvetica-Bold" },
  notesBox:   { fontSize: 8, color: M, lineHeight: 1.5, fontStyle: "italic", borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
  subHead:    { flexDirection: "row", backgroundColor: "#f1f5f9", padding: "4 6" },
  subHC:      { fontSize: 7, fontFamily: "Helvetica-Bold", color: M },
  subRow:     { flexDirection: "row", padding: "3 6", borderTopWidth: 1, borderTopColor: B },
  subC:       { fontSize: 7.5, color: N },
  subCM:      { fontSize: 7.5, color: M },
  subCR:      { fontSize: 7.5, color: N, textAlign: "right" },
  totalsBox:  { alignItems: "flex-end", marginTop: 8, borderTopWidth: 1, borderTopColor: B, paddingTop: 8 },
  totalRow:   { flexDirection: "row", gap: 10, marginBottom: 3 },
  totalLabel: { fontSize: 8, color: M, width: 90, textAlign: "right" },
  totalValue: { fontSize: 8, color: N, fontFamily: "Helvetica-Bold", width: 70, textAlign: "right" },
  totalBig:   { fontSize: 12, color: GR, fontFamily: "Helvetica-Bold", width: 70, textAlign: "right" },
  footer:     { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: B, paddingTop: 5 },
  footerText: { fontSize: 7, color: M },
})

interface Props { data: OrcamentoExportData }

export function OrcamentoPDF({ data }: Props) {
  const { quote, customer, os, items, companyName } = data
  const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const statusColor = STATUS_COLORS[quote.status] ?? M

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{companyName}</Text>
            <Text style={s.brandSub}>Sistema de Gestão — ScooterGestor</Text>
          </View>
          <View style={s.hRight}>
            <Text style={s.hTitle}>Orçamento</Text>
            <Text style={s.hNum}>{quote.quote_number}  ·  Gerado em {gerado}</Text>
            <View style={s.limeBar} />
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          {[
            { label: "Itens",    value: String(items.length) },
            { label: "Subtotal", value: fmt(quote.subtotal) },
            { label: "Desconto", value: quote.discount > 0 ? fmt(quote.discount) : "—" },
            { label: "Total",    value: fmt(quote.total) },
          ].map((k) => (
            <View key={k.label} style={s.kpiBox}>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={s.kpiValue}>{k.value}</Text>
              <View style={s.kpiAccent} />
            </View>
          ))}
        </View>

        {/* Cliente + Detalhes */}
        <View style={s.row2}>
          <View style={s.col}>
            <Text style={s.secTitle}>Cliente</Text>
            <View style={s.infoBox}>
              {customer ? (
                <>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Nome</Text>
                    <Text style={s.infoValueB}>{customer.name}</Text>
                  </View>
                  {(customer.whatsapp ?? customer.phone) && (
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Telefone</Text>
                      <Text style={s.infoValue}>{customer.whatsapp ?? customer.phone}</Text>
                    </View>
                  )}
                  {customer.email && (
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>E-mail</Text>
                      <Text style={s.infoValue}>{customer.email}</Text>
                    </View>
                  )}
                  {customer.cpf_cnpj && (
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>CPF/CNPJ</Text>
                      <Text style={s.infoValue}>{customer.cpf_cnpj}</Text>
                    </View>
                  )}
                </>
              ) : <Text style={{ fontSize: 8, color: M }}>Não informado</Text>}
            </View>
          </View>

          <View style={s.col}>
            <Text style={s.secTitle}>Detalhes</Text>
            <View style={s.infoBox}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Status</Text>
                <Text style={[s.infoValueB, { color: statusColor }]}>{STATUS_LABELS[quote.status] ?? quote.status}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Emissão</Text>
                <Text style={s.infoValue}>{fmtDate(quote.created_at)}</Text>
              </View>
              {quote.valid_until && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Válido até</Text>
                  <Text style={s.infoValue}>{fmtDate(quote.valid_until)}</Text>
                </View>
              )}
              {quote.approved_at && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Aprovado em</Text>
                  <Text style={[s.infoValue, { color: GR, fontFamily: "Helvetica-Bold" }]}>{fmtDate(quote.approved_at)}</Text>
                </View>
              )}
              {quote.rejected_at && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Rejeitado em</Text>
                  <Text style={[s.infoValue, { color: RD }]}>{fmtDate(quote.rejected_at)}</Text>
                </View>
              )}
              {os && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>OS vinculada</Text>
                  <Text style={s.infoValue}>{os.order_number}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Observações */}
        {quote.notes && (
          <>
            <Text style={s.secTitle}>Observações</Text>
            <Text style={s.notesBox}>{quote.notes}</Text>
          </>
        )}

        {/* Itens */}
        {items.length > 0 && (
          <>
            <Text style={s.secTitle}>Itens ({items.length})</Text>
            <View style={s.subHead}>
              <Text style={[s.subHC, { flex: 3 }]}>Descrição</Text>
              <Text style={[s.subHC, { flex: 0.8, textAlign: "center" }]}>Tipo</Text>
              <Text style={[s.subHC, { flex: 0.6, textAlign: "right" }]}>Qtd</Text>
              <Text style={[s.subHC, { flex: 1, textAlign: "right" }]}>Unitário</Text>
              <Text style={[s.subHC, { flex: 1, textAlign: "right" }]}>Total</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={s.subRow}>
                <Text style={[s.subC, { flex: 3 }]}>{item.description}</Text>
                <Text style={[s.subCM, { flex: 0.8, textAlign: "center" }]}>{ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}</Text>
                <Text style={[s.subCM, { flex: 0.6, textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.subCM, { flex: 1, textAlign: "right" }]}>{fmt(item.unit_price)}</Text>
                <Text style={[s.subCR, { flex: 1 }]}>{fmt(item.total)}</Text>
              </View>
            ))}
            <View style={s.totalsBox}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal:</Text>
                <Text style={s.totalValue}>{fmt(quote.subtotal)}</Text>
              </View>
              {quote.discount > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Desconto:</Text>
                  <Text style={[s.totalValue, { color: RD }]}>− {fmt(quote.discount)}</Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={[s.totalLabel, { fontFamily: "Helvetica-Bold" }]}>Total:</Text>
                <Text style={s.totalBig}>{fmt(quote.total)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{companyName} — {quote.quote_number}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
