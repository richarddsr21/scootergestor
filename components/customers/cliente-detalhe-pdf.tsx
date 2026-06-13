import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { ClienteExportData } from "@/lib/actions/customers"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Débito", debit_card: "Débito",
  cartao_credito: "Crédito", credit_card: "Crédito",
  boleto: "Boleto",
  payment_link: "Link",
  outro: "Outro",
}
const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente",
}
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente", parcial: "Parcial", pago: "Pago",
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
  page:         { fontFamily: "Helvetica", fontSize: 9, color: N, padding: 36, backgroundColor: W },
  // header
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: N },
  brand:        { fontSize: 15, fontFamily: "Helvetica-Bold", color: N },
  brandSub:     { fontSize: 7.5, color: M, marginTop: 2 },
  hRight:       { alignItems: "flex-end" },
  hTitle:       { fontSize: 11, fontFamily: "Helvetica-Bold", color: N },
  hSub:         { fontSize: 7.5, color: M, marginTop: 2 },
  limeBar:      { width: 32, height: 3, backgroundColor: L, marginTop: 5 },
  // summary cards
  kpiRow:       { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpiBox:       { flex: 1, borderWidth: 1, borderColor: B, borderRadius: 4, padding: 9, backgroundColor: G },
  kpiLabel:     { fontSize: 6.5, color: M, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  kpiValue:     { fontSize: 14, fontFamily: "Helvetica-Bold", color: N },
  kpiAccent:    { width: 18, height: 2, backgroundColor: L, marginTop: 4 },
  // section title
  secTitle:     { fontSize: 9, fontFamily: "Helvetica-Bold", color: N, marginBottom: 6, marginTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: B },
  // two-column layout
  row2:         { flexDirection: "row", gap: 12, marginBottom: 12 },
  col:          { flex: 1 },
  // info box (customer details)
  infoBox:      { borderWidth: 1, borderColor: B, borderRadius: 4, padding: 10, backgroundColor: G },
  infoRow:      { flexDirection: "row", marginBottom: 4 },
  infoLabel:    { fontSize: 7.5, color: M, width: 70 },
  infoValue:    { fontSize: 7.5, color: N, flex: 1 },
  infoValueB:   { fontSize: 7.5, color: N, flex: 1, fontFamily: "Helvetica-Bold" },
  // vehicle card
  vehicleCard:  { borderWidth: 1, borderColor: B, borderRadius: 4, padding: 8, marginBottom: 6, backgroundColor: G },
  vehicleTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: N, marginBottom: 5, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: B },
  vGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  vItem:        { width: "30%" },
  vLabel:       { fontSize: 6.5, color: M, marginBottom: 1 },
  vValue:       { fontSize: 7.5, color: N },
  // OS card
  osCard:       { borderWidth: 1, borderColor: B, borderRadius: 4, marginBottom: 8, overflow: "hidden" },
  osHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: N, padding: "6 10" },
  osNum:        { fontSize: 8, fontFamily: "Helvetica-Bold", color: W },
  osStatus:     { fontSize: 7, color: "#94a3b8" },
  osTotal:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: L },
  osBody:       { padding: "8 10", backgroundColor: W },
  osProblem:    { fontSize: 7.5, color: N, marginBottom: 6 },
  osDiag:       { fontSize: 7.5, color: M, marginBottom: 6, fontStyle: "italic" },
  osMeta:       { flexDirection: "row", gap: 12, marginBottom: 8 },
  osMetaItem:   { flexDirection: "row", gap: 3 },
  osMetaLabel:  { fontSize: 7, color: M },
  osMetaValue:  { fontSize: 7, color: N, fontFamily: "Helvetica-Bold" },
  // items sub-table
  subTitle:     { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: N, marginBottom: 4 },
  subHead:      { flexDirection: "row", backgroundColor: "#f1f5f9", padding: "3 6" },
  subHC:        { fontSize: 7, fontFamily: "Helvetica-Bold", color: M },
  subRow:       { flexDirection: "row", padding: "3 6", borderTopWidth: 1, borderTopColor: B },
  subC:         { fontSize: 7, color: N },
  subCM:        { fontSize: 7, color: M },
  subCR:        { fontSize: 7, color: N, textAlign: "right" },
  // totals row
  totalsRow:    { flexDirection: "row", justifyContent: "flex-end", gap: 16, padding: "6 10", backgroundColor: G, borderTopWidth: 1, borderTopColor: B },
  totalItem:    { flexDirection: "row", gap: 4 },
  totalLabel:   { fontSize: 7, color: M },
  totalValue:   { fontSize: 7, color: N, fontFamily: "Helvetica-Bold" },
  totalValueG:  { fontSize: 7, color: GR, fontFamily: "Helvetica-Bold" },
  // payments
  payRow:       { flexDirection: "row", gap: 8, marginTop: 6 },
  payChip:      { borderWidth: 1, borderColor: B, borderRadius: 3, padding: "3 7", backgroundColor: G },
  payMethod:    { fontSize: 7, fontFamily: "Helvetica-Bold", color: N },
  payAmt:       { fontSize: 7, color: GR },
  payDate:      { fontSize: 6.5, color: M },
  // footer
  footer:       { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: B, paddingTop: 5 },
  footerText:   { fontSize: 7, color: M },
})

interface Props {
  data: ClienteExportData
  companyName: string
}

function payStatusColor(s: string) {
  if (s === "pago") return GR
  if (s === "parcial") return YL
  return RD
}

export function ClienteDetalhePDF({ data, companyName }: Props) {
  const { customer, vehicles, serviceOrders, stats } = data
  const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const address = [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ")

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
            <Text style={s.hTitle}>Ficha do Cliente</Text>
            <Text style={s.hSub}>Gerado em {gerado}</Text>
            <View style={s.limeBar} />
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          {[
            { label: "Ordens de Serviço",  value: String(stats.totalOs) },
            { label: "OS Concluídas",       value: String(stats.osCompletas) },
            { label: "Total Pago",          value: fmt(stats.totalPago) },
            { label: "Saldo Pendente",      value: fmt(stats.totalPendente) },
          ].map((k) => (
            <View key={k.label} style={s.kpiBox}>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={s.kpiValue}>{k.value}</Text>
              <View style={s.kpiAccent} />
            </View>
          ))}
        </View>

        {/* Customer + vehicles side by side */}
        <View style={s.row2}>
          {/* Customer info */}
          <View style={s.col}>
            <Text style={s.secTitle}>Dados do Cliente</Text>
            <View style={s.infoBox}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Nome</Text>
                <Text style={s.infoValueB}>{customer.name}</Text>
              </View>
              {(customer.phone || customer.whatsapp) && (
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
              {address && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Endereço</Text>
                  <Text style={s.infoValue}>{address}</Text>
                </View>
              )}
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Cadastro</Text>
                <Text style={s.infoValue}>{fmtDate(customer.created_at)}</Text>
              </View>
              {customer.notes && (
                <View style={[s.infoRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: B }]}>
                  <Text style={s.infoLabel}>Obs.</Text>
                  <Text style={[s.infoValue, { color: M }]}>{customer.notes}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Vehicles */}
          <View style={s.col}>
            <Text style={s.secTitle}>Scooters ({vehicles.length})</Text>
            {vehicles.length === 0 ? (
              <Text style={{ fontSize: 8, color: M }}>Nenhuma scooter cadastrada.</Text>
            ) : (
              vehicles.map((v) => (
                <View key={v.id} style={s.vehicleCard}>
                  <Text style={s.vehicleTitle}>
                    {[v.type, v.brand, v.model].filter(Boolean).join(" · ")}
                  </Text>
                  <View style={s.vGrid}>
                    {v.color && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Cor</Text>
                        <Text style={s.vValue}>{v.color}</Text>
                      </View>
                    )}
                    {v.serial_number && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Nº Série</Text>
                        <Text style={s.vValue}>{v.serial_number}</Text>
                      </View>
                    )}
                    {v.battery_type && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Bateria</Text>
                        <Text style={s.vValue}>{v.battery_type}</Text>
                      </View>
                    )}
                    {v.voltage && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Voltagem</Text>
                        <Text style={s.vValue}>{v.voltage}</Text>
                      </View>
                    )}
                    {v.power && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Potência</Text>
                        <Text style={s.vValue}>{v.power}</Text>
                      </View>
                    )}
                    {v.warranty_until && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Garantia até</Text>
                        <Text style={s.vValue}>{fmtDate(v.warranty_until)}</Text>
                      </View>
                    )}
                    {v.purchase_date && (
                      <View style={s.vItem}>
                        <Text style={s.vLabel}>Compra</Text>
                        <Text style={s.vValue}>{fmtDate(v.purchase_date)}</Text>
                      </View>
                    )}
                  </View>
                  {v.notes && (
                    <Text style={{ fontSize: 7, color: M, marginTop: 5 }}>{v.notes}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* OS Section */}
        <Text style={[s.secTitle, { marginTop: 4 }]}>
          Histórico de Ordens de Serviço ({serviceOrders.length})
        </Text>

        {serviceOrders.length === 0 ? (
          <Text style={{ fontSize: 8, color: M }}>Nenhuma OS encontrada.</Text>
        ) : (
          serviceOrders.map((os) => (
            <View key={os.id} style={s.osCard} wrap={false}>
              {/* OS header bar */}
              <View style={s.osHeader}>
                <View>
                  <Text style={s.osNum}>{os.order_number}</Text>
                  <Text style={s.osStatus}>
                    {os.status_name ?? "—"}  ·  {PRIORITY_LABELS[os.priority] ?? os.priority}  ·  {fmtDate(os.created_at)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.osTotal}>{fmt(os.total)}</Text>
                  <Text style={{ fontSize: 7, color: payStatusColor(os.payment_status), marginTop: 2 }}>
                    {PAYMENT_STATUS_LABELS[os.payment_status] ?? os.payment_status}
                  </Text>
                </View>
              </View>

              {/* OS body */}
              <View style={s.osBody}>
                {/* Problem */}
                <Text style={s.osProblem}>{os.reported_problem}</Text>

                {/* Diagnosis */}
                {os.technical_diagnosis && (
                  <Text style={s.osDiag}>Diagnóstico: {os.technical_diagnosis}</Text>
                )}

                {/* Meta row */}
                <View style={s.osMeta}>
                  <View style={s.osMetaItem}>
                    <Text style={s.osMetaLabel}>Mão de obra:</Text>
                    <Text style={s.osMetaValue}>{fmt(os.labor_total)}</Text>
                  </View>
                  <View style={s.osMetaItem}>
                    <Text style={s.osMetaLabel}>Peças:</Text>
                    <Text style={s.osMetaValue}>{fmt(os.parts_total)}</Text>
                  </View>
                  {os.discount > 0 && (
                    <View style={s.osMetaItem}>
                      <Text style={s.osMetaLabel}>Desconto:</Text>
                      <Text style={s.osMetaValue}>-{fmt(os.discount)}</Text>
                    </View>
                  )}
                  {os.completed_at && (
                    <View style={s.osMetaItem}>
                      <Text style={s.osMetaLabel}>Concluída:</Text>
                      <Text style={s.osMetaValue}>{fmtDate(os.completed_at)}</Text>
                    </View>
                  )}
                  {os.delivered_at && (
                    <View style={s.osMetaItem}>
                      <Text style={s.osMetaLabel}>Entregue:</Text>
                      <Text style={s.osMetaValue}>{fmtDate(os.delivered_at)}</Text>
                    </View>
                  )}
                </View>

                {/* Items sub-table */}
                {os.items.length > 0 && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={s.subTitle}>Itens</Text>
                    <View style={s.subHead}>
                      <Text style={[s.subHC, { flex: 3 }]}>Descrição</Text>
                      <Text style={[s.subHC, { flex: 0.8, textAlign: "center" }]}>Tipo</Text>
                      <Text style={[s.subHC, { flex: 0.6, textAlign: "right" }]}>Qtd</Text>
                      <Text style={[s.subHC, { flex: 1, textAlign: "right" }]}>Unitário</Text>
                      <Text style={[s.subHC, { flex: 1, textAlign: "right" }]}>Total</Text>
                    </View>
                    {os.items.map((item, i) => (
                      <View key={i} style={s.subRow}>
                        <Text style={[s.subC, { flex: 3 }]}>{item.description}</Text>
                        <Text style={[s.subCM, { flex: 0.8, textAlign: "center" }]}>
                          {item.item_type === "service" ? "Serv." : "Peça"}
                        </Text>
                        <Text style={[s.subCM, { flex: 0.6, textAlign: "right" }]}>{item.quantity}</Text>
                        <Text style={[s.subCM, { flex: 1, textAlign: "right" }]}>{fmt(item.unit_price)}</Text>
                        <Text style={[s.subCR, { flex: 1 }]}>{fmt(item.total)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Payments */}
                {os.payments.length > 0 && (
                  <View>
                    <Text style={s.subTitle}>Pagamentos</Text>
                    <View style={s.payRow}>
                      {os.payments.map((p, i) => (
                        <View key={i} style={s.payChip}>
                          <Text style={s.payMethod}>
                            {METHOD_LABELS[p.method] ?? p.method}
                            {p.installments > 1 ? ` ${p.installments}x` : ""}
                          </Text>
                          <Text style={s.payAmt}>{fmt(p.amount)}</Text>
                          {p.paid_at && <Text style={s.payDate}>{fmtDate(p.paid_at)}</Text>}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Totals footer */}
              <View style={s.totalsRow}>
                <View style={s.totalItem}>
                  <Text style={s.totalLabel}>Total pago:</Text>
                  <Text style={s.totalValueG}>
                    {fmt(os.payments.reduce((a, p) => a + p.amount, 0))}
                  </Text>
                </View>
                <View style={s.totalItem}>
                  <Text style={s.totalLabel}>Total OS:</Text>
                  <Text style={s.totalValue}>{fmt(os.total)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{companyName} — Ficha do Cliente: {customer.name}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
