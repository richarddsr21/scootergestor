import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { OsExportData } from "@/lib/actions/service-orders"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

const ITEM_TYPE_LABELS: Record<string, string> = { part: "Peça", service: "Serviço", labor: "M.O." }
const PRIORITY_LABELS: Record<string, string> = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" }
const PAYMENT_STATUS_LABELS: Record<string, string> = { pendente: "Pendente", parcial: "Parcial", pago: "Pago" }
const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Débito", debit_card: "Débito",
  cartao_credito: "Crédito", credit_card: "Crédito",
  boleto: "Boleto",
  payment_link: "Link",
  outro: "Outro",
}

const N = "#0f172a"
const M = "#64748b"
const L = "#84cc16"
const B = "#e2e8f0"
const G = "#f8fafc"
const W = "#ffffff"
const GR = "#16a34a"
const YL = "#f59e0b"
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
  textBlock:  { fontSize: 8, color: N, lineHeight: 1.5, borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
  textBlockM: { fontSize: 8, color: M, lineHeight: 1.5, fontStyle: "italic", borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
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
  totalBig:   { fontSize: 11, color: GR, fontFamily: "Helvetica-Bold", width: 70, textAlign: "right" },
  payRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  payChip:    { borderWidth: 1, borderColor: B, borderRadius: 3, padding: "4 8", backgroundColor: G },
  payMethod:  { fontSize: 7, fontFamily: "Helvetica-Bold", color: N },
  payAmt:     { fontSize: 7, color: GR },
  payDate:    { fontSize: 6.5, color: M },
  statusBadge:{ borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: "flex-end" },
  footer:     { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: B, paddingTop: 5 },
  footerText: { fontSize: 7, color: M },
})

interface Props { data: OsExportData }

function pgtoColor(s: string) {
  if (s === "pago") return GR
  if (s === "parcial") return YL
  return RD
}

export function OsPDF({ data }: Props) {
  const { os, customer, technician, status, items, checklist, payments, companyName } = data
  const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const vehicle = [os.vehicle_brand, os.vehicle_model].filter(Boolean).join(" ")

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
            <Text style={s.hTitle}>Ordem de Serviço</Text>
            <Text style={s.hNum}>{os.order_number}  ·  Gerado em {gerado}</Text>
            <View style={s.limeBar} />
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          {[
            { label: "Mão de Obra",   value: fmt(os.labor_total) },
            { label: "Peças / Serv.", value: fmt(os.parts_total) },
            { label: "Desconto",      value: os.discount > 0 ? fmt(os.discount) : "—" },
            { label: "Total",         value: fmt(os.total) },
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
                <Text style={s.infoValueB}>{status?.name ?? "—"}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Prioridade</Text>
                <Text style={s.infoValue}>{PRIORITY_LABELS[os.priority] ?? os.priority}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Pagamento</Text>
                <Text style={[s.infoValue, { color: pgtoColor(os.payment_status), fontFamily: "Helvetica-Bold" }]}>
                  {PAYMENT_STATUS_LABELS[os.payment_status] ?? os.payment_status}
                </Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Abertura</Text>
                <Text style={s.infoValue}>{fmtDate(os.created_at)}</Text>
              </View>
              {os.expected_delivery_at && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Previsão</Text>
                  <Text style={s.infoValue}>{fmtDate(os.expected_delivery_at)}</Text>
                </View>
              )}
              {os.completed_at && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Concluída</Text>
                  <Text style={s.infoValue}>{fmtDate(os.completed_at)}</Text>
                </View>
              )}
              {technician && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Técnico</Text>
                  <Text style={s.infoValue}>{technician.name}</Text>
                </View>
              )}
              {vehicle && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Scooter</Text>
                  <Text style={s.infoValue}>{vehicle}</Text>
                </View>
              )}
              {os.vehicle_chassis && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Chassi</Text>
                  <Text style={s.infoValue}>{os.vehicle_chassis}</Text>
                </View>
              )}
              {os.mileage_km != null && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Km</Text>
                  <Text style={s.infoValue}>{os.mileage_km.toLocaleString("pt-BR")}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Problema */}
        <Text style={s.secTitle}>Problema Relatado</Text>
        <Text style={s.textBlock}>{os.reported_problem}</Text>

        {/* Diagnóstico */}
        {os.technical_diagnosis && (
          <>
            <Text style={s.secTitle}>Diagnóstico Técnico</Text>
            <Text style={s.textBlockM}>{os.technical_diagnosis}</Text>
          </>
        )}

        {/* Observações ao cliente */}
        {os.customer_notes && (
          <>
            <Text style={s.secTitle}>Observações para o Cliente</Text>
            <Text style={s.textBlock}>{os.customer_notes}</Text>
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
              {os.labor_total > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Mão de obra:</Text>
                  <Text style={s.totalValue}>{fmt(os.labor_total)}</Text>
                </View>
              )}
              {os.parts_total > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Peças / serviços:</Text>
                  <Text style={s.totalValue}>{fmt(os.parts_total)}</Text>
                </View>
              )}
              {os.discount > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Desconto:</Text>
                  <Text style={[s.totalValue, { color: RD }]}>− {fmt(os.discount)}</Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={[s.totalLabel, { fontFamily: "Helvetica-Bold" }]}>Total:</Text>
                <Text style={s.totalBig}>{fmt(os.total)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <>
            <Text style={s.secTitle}>Checklist</Text>
            {checklist.map((item, i) => (
              <View key={i} style={[s.infoRow, { marginBottom: 3 }]}>
                <Text style={[s.infoLabel, { width: 140 }]}>{item.label}</Text>
                <Text style={s.infoValue}>{item.value ?? "—"}{item.notes ? ` · ${item.notes}` : ""}</Text>
              </View>
            ))}
          </>
        )}

        {/* Pagamentos */}
        {payments.length > 0 && (
          <>
            <Text style={s.secTitle}>Pagamentos</Text>
            <View style={s.payRow}>
              {payments.map((p, i) => (
                <View key={i} style={s.payChip}>
                  <Text style={s.payMethod}>
                    {METHOD_LABELS[p.method] ?? p.method}{p.installments > 1 ? ` ${p.installments}x` : ""}
                  </Text>
                  <Text style={s.payAmt}>{fmt(p.amount)}</Text>
                  {p.paid_at && <Text style={s.payDate}>{fmtDate(p.paid_at)}</Text>}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{companyName} — {os.order_number}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
