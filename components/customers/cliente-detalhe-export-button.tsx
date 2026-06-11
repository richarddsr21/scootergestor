"use client"

import { useState } from "react"
import { FileDown, Sheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { exportClienteAction } from "@/lib/actions/customers"

const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão de Débito", debit_card: "Cartão de Débito",
  cartao_credito: "Cartão de Crédito", credit_card: "Cartão de Crédito",
  boleto: "Boleto",
  payment_link: "Link de Pagamento",
  outro: "Outro",
}

interface Props {
  customerId: string
  customerName: string
  companyName: string
}

export function ClienteDetalheExportButton({ customerId, customerName, companyName }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  async function handleDownloadPdf() {
    setLoadingPdf(true)
    try {
      const data = await exportClienteAction(customerId)
      if (!data) throw new Error("Sem dados")

      const [{ pdf }, { ClienteDetalhePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./cliente-detalhe-pdf"),
      ])
      const blob = await pdf(ClienteDetalhePDF({ data, companyName })).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cliente-${customerName.replace(/\s+/g, "-").toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Erro ao gerar PDF")
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleDownloadXlsx() {
    setLoadingXlsx(true)
    try {
      const data = await exportClienteAction(customerId)
      if (!data) throw new Error("Sem dados")

      const [{ default: ExcelJS }, { C, FMT, banner, section, kpiGrid, kv, table, drow, hdr }] = await Promise.all([
        import("exceljs"),
        import("@/lib/xl"),
      ])

      const wb = new ExcelJS.Workbook()
      wb.creator = companyName
      wb.created = new Date()

      const slug = customerName.replace(/\s+/g, "-").toLowerCase()
      const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

      // ── Aba 1: Resumo ─────────────────────────────────────────────────────
      const wsR = wb.addWorksheet("Resumo")
      wsR.columns = [{ width: 24 }, { width: 20 }, { width: 20 }, { width: 22 }, { width: 20 }]

      banner(wsR, `${companyName} — Ficha do Cliente`, 5)
      banner(wsR, data.customer.name, 5, { height: 28, size: 13, bold: true, color: C.lime })
      banner(wsR, `Gerado em ${gerado}`, 5, { height: 20, size: 9, bold: false, color: C.lime })

      section(wsR, "INDICADORES", 5)
      kpiGrid(wsR, [
        { label: "TOTAL DE OS",     value: data.stats.totalOs },
        { label: "OS CONCLUÍDAS",   value: data.stats.osCompletas },
        { label: "VEÍCULOS",        value: data.vehicles.length },
        { label: "TOTAL PAGO",      value: data.stats.totalPago,      fmt: FMT.brl, color: C.green },
        { label: "SALDO PENDENTE",  value: data.stats.totalPendente,  fmt: FMT.brl, color: data.stats.totalPendente > 0 ? C.yellow : C.green },
      ], 5)

      section(wsR, "DADOS DE CONTATO", 5)
      wsR.getColumn(1).width = 24
      wsR.getColumn(2).width = 40
      kv(wsR, "Nome",       data.customer.name)
      if (data.customer.phone)    kv(wsR, "Telefone",  data.customer.phone)
      if (data.customer.whatsapp) kv(wsR, "WhatsApp",  data.customer.whatsapp)
      if (data.customer.email)    kv(wsR, "E-mail",    data.customer.email)
      if (data.customer.cpf_cnpj) kv(wsR, "CPF/CNPJ", data.customer.cpf_cnpj)
      if (data.customer.address)  kv(wsR, "Endereço",  data.customer.address)
      const city = [data.customer.city, data.customer.state].filter(Boolean).join(" / ")
      if (city) kv(wsR, "Cidade/UF", city)
      if (data.customer.zip_code) kv(wsR, "CEP",       data.customer.zip_code)
      if (data.customer.notes)    kv(wsR, "Observações", data.customer.notes)

      // ── Aba 2: Veículos ───────────────────────────────────────────────────
      if (data.vehicles.length > 0) {
        const wsV = wb.addWorksheet("Veículos")
        table(wsV, [
          { header: "Tipo",        key: "type",    width: 14 },
          { header: "Marca",       key: "brand",   width: 16 },
          { header: "Modelo",      key: "model",   width: 18 },
          { header: "Cor",         key: "color",   width: 10 },
          { header: "Nº Série",    key: "serial",  width: 18 },
          { header: "Bateria",     key: "battery", width: 14 },
          { header: "Voltagem",    key: "voltage", width: 10, align: "center" },
          { header: "Potência",    key: "power",   width: 10, align: "center" },
          { header: "Autonomia",   key: "autonomy",width: 12, align: "center" },
          { header: "Compra",      key: "purchase",width: 12, align: "center", fmt: FMT.date },
          { header: "Garantia até",key: "warranty",width: 13, align: "center", fmt: FMT.date },
        ], data.vehicles.map((v) => ({
          type:     v.type,
          brand:    v.brand ?? "",
          model:    v.model ?? "",
          color:    v.color ?? "",
          serial:   v.serial_number ?? "",
          battery:  v.battery_type ?? "",
          voltage:  v.voltage ?? "",
          power:    v.power ?? "",
          autonomy: v.autonomy ?? "",
          purchase: v.purchase_date ? new Date(v.purchase_date) : "",
          warranty: v.warranty_until ? new Date(v.warranty_until) : "",
        })))
      }

      // ── Aba 3: Ordens de Serviço ──────────────────────────────────────────
      if (data.serviceOrders.length > 0) {
        const wsOS = wb.addWorksheet("Ordens de Serviço")
        table(wsOS, [
          { header: "Nº OS",        key: "num",      width: 14 },
          { header: "Status",       key: "status",   width: 18 },
          { header: "Prioridade",   key: "prio",     width: 11 },
          { header: "Problema Relatado", key: "problem", width: 36 },
          { header: "Mão de Obra",  key: "labor",    width: 14, align: "right", fmt: FMT.brl },
          { header: "Peças",        key: "parts",    width: 14, align: "right", fmt: FMT.brl },
          { header: "Desconto",     key: "discount", width: 12, align: "right", fmt: FMT.brl },
          { header: "Total",        key: "total",    width: 14, align: "right", fmt: FMT.brl, color: C.navy },
          { header: "Pgto",         key: "pgto",     width: 10, align: "center" },
          { header: "Abertura",     key: "opened",   width: 12, align: "center", fmt: FMT.date },
          { header: "Conclusão",    key: "closed",   width: 12, align: "center", fmt: FMT.date },
        ], data.serviceOrders.map((os) => ({
          num:      os.order_number,
          status:   os.status_name ?? "",
          prio:     os.priority,
          problem:  os.reported_problem,
          labor:    os.labor_total,
          parts:    os.parts_total,
          discount: os.discount,
          total:    os.total,
          pgto:     os.payment_status,
          opened:   new Date(os.created_at),
          closed:   os.completed_at ? new Date(os.completed_at) : "",
        })))

        // Color "pgto" cells
        const pgtoCol = 9
        data.serviceOrders.forEach((os, i) => {
          const row = wsOS.getRow(i + 2)
          const cell = row.getCell(pgtoCol)
          const color = os.payment_status === "pago" ? C.green : os.payment_status === "parcial" ? C.yellow : C.red
          cell.font = { name: "Calibri", size: 9, color: { argb: color }, bold: true }
        })

        // ── Aba 4: Itens das OS ───────────────────────────────────────────
        const allItems = data.serviceOrders.flatMap((os) =>
          os.items.map((item) => ({
            num:   os.order_number,
            desc:  item.description,
            type:  item.item_type === "service" ? "Serviço" : "Peça",
            qty:   item.quantity,
            unit:  item.unit_price,
            total: item.total,
          }))
        )
        if (allItems.length > 0) {
          const wsI = wb.addWorksheet("Itens das OS")
          table(wsI, [
            { header: "Nº OS",        key: "num",   width: 14 },
            { header: "Descrição",    key: "desc",  width: 40 },
            { header: "Tipo",         key: "type",  width: 10, align: "center" },
            { header: "Qtd",          key: "qty",   width: 7,  align: "center", fmt: FMT.int },
            { header: "Unitário",     key: "unit",  width: 14, align: "right",  fmt: FMT.brl },
            { header: "Total",        key: "total", width: 14, align: "right",  fmt: FMT.brl, color: C.green },
          ], allItems)
        }

        // ── Aba 5: Pagamentos ─────────────────────────────────────────────
        const allPayments = data.serviceOrders.flatMap((os) =>
          os.payments.map((p) => ({
            num:    os.order_number,
            method: METHOD_LABELS[p.method] ?? p.method,
            inst:   p.installments,
            amount: p.amount,
            dt:     p.paid_at ? new Date(p.paid_at) : "",
          }))
        )
        if (allPayments.length > 0) {
          const wsP = wb.addWorksheet("Pagamentos")
          table(wsP, [
            { header: "Nº OS",     key: "num",    width: 14 },
            { header: "Método",    key: "method", width: 20 },
            { header: "Parcelas",  key: "inst",   width: 10, align: "center", fmt: FMT.int },
            { header: "Valor",     key: "amount", width: 16, align: "right",  fmt: FMT.brl, color: C.green },
            { header: "Data",      key: "dt",     width: 12, align: "center", fmt: FMT.date },
          ], allPayments)
        }
      }

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cliente-${slug}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      toast.error("Erro ao gerar planilha")
    } finally {
      setLoadingXlsx(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadXlsx}
        disabled={loadingXlsx || loadingPdf}
      >
        {loadingXlsx ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Sheet className="mr-1.5 h-4 w-4" />
        )}
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={loadingPdf || loadingXlsx}
      >
        {loadingPdf ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-1.5 h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  )
}
