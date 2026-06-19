"use client"

import { useState } from "react"
import { FileDown, Sheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { exportOsAction } from "@/lib/actions/service-orders"

const ITEM_TYPE_LABELS: Record<string, string> = { part: "Peça", service: "Serviço", labor: "M.O." }
const PRIORITY_LABELS: Record<string, string> = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" }
const PAYMENT_STATUS_LABELS: Record<string, string> = { pendente: "Pendente", parcial: "Parcial", pago: "Pago" }
const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Débito", debit_card: "Débito",
  cartao_credito: "Crédito", credit_card: "Crédito",
  boleto: "Boleto",
  payment_link: "Link de Pagamento",
  outro: "Outro",
}

interface Props {
  osId: string
  orderNumber: string
}

export function OsExportButton({ osId, orderNumber }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  async function handleDownloadPdf() {
    setLoadingPdf(true)
    try {
      const data = await exportOsAction(osId)
      if (!data) throw new Error("Sem dados")

      const [{ pdf }, { OsPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./os-pdf"),
      ])
      const blob = await pdf(OsPDF({ data })).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${orderNumber.toLowerCase()}.pdf`
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
      const data = await exportOsAction(osId)
      if (!data) throw new Error("Sem dados")

      const [{ default: ExcelJS }, { C, FMT, banner, section, kv, table }] = await Promise.all([
        import("exceljs"),
        import("@/lib/xl"),
      ])

      const wb = new ExcelJS.Workbook()
      wb.creator = data.companyName
      wb.created = new Date()
      const gerado = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

      // ── Aba 1: Resumo ─────────────────────────────────────────────────────
      const wsR = wb.addWorksheet("Resumo")
      wsR.columns = [{ width: 22 }, { width: 36 }, { width: 16 }, { width: 16 }, { width: 16 }]

      banner(wsR, `${data.companyName} — Ordem de Serviço`, 5)
      banner(wsR, data.os.order_number, 5, { height: 28, size: 13, bold: true, color: C.lime })
      banner(wsR, `Gerado em ${gerado}`, 5, { height: 20, size: 9, bold: false, color: C.lime })

      section(wsR, "DADOS DA OS", 5)
      kv(wsR, "Número",      data.os.order_number)
      kv(wsR, "Status",      data.status?.name ?? "—")
      kv(wsR, "Prioridade",  PRIORITY_LABELS[data.os.priority] ?? data.os.priority)
      kv(wsR, "Pagamento",   PAYMENT_STATUS_LABELS[data.os.payment_status] ?? data.os.payment_status)
      kv(wsR, "Abertura",    new Date(data.os.created_at), FMT.date)
      if (data.os.expected_delivery_at) kv(wsR, "Previsão",   new Date(data.os.expected_delivery_at), FMT.date)
      if (data.os.completed_at)         kv(wsR, "Concluída",  new Date(data.os.completed_at), FMT.date)
      if (data.os.delivered_at)         kv(wsR, "Entregue",   new Date(data.os.delivered_at), FMT.date)
      if (data.technician)              kv(wsR, "Técnico",    data.technician.name)

      section(wsR, "VEÍCULO", 5)
      if (data.os.vehicle_brand)   kv(wsR, "Marca",  data.os.vehicle_brand)
      if (data.os.vehicle_model)   kv(wsR, "Modelo", data.os.vehicle_model)
      if (data.os.vehicle_chassis) kv(wsR, "Chassi", data.os.vehicle_chassis)
      if (data.os.mileage_km != null) kv(wsR, "Quilometragem", data.os.mileage_km, FMT.int)

      section(wsR, "CLIENTE", 5)
      if (data.customer) {
        kv(wsR, "Nome",     data.customer.name)
        if (data.customer.whatsapp) kv(wsR, "WhatsApp", data.customer.whatsapp)
        if (data.customer.phone)    kv(wsR, "Telefone", data.customer.phone)
        if (data.customer.email)    kv(wsR, "E-mail",   data.customer.email)
        if (data.customer.cpf_cnpj) kv(wsR, "CPF/CNPJ",data.customer.cpf_cnpj)
      }

      section(wsR, "FINANCEIRO", 5)
      kv(wsR, "Mão de Obra",      data.os.labor_total,  FMT.brl)
      kv(wsR, "Peças / Serviços", data.os.parts_total,  FMT.brl)
      if (data.os.discount > 0)
        kv(wsR, "Desconto",       data.os.discount,     FMT.brl)
      kv(wsR, "Total",            data.os.total,        FMT.brl)

      section(wsR, "DESCRIÇÕES", 5)
      kv(wsR, "Problema Relatado",   data.os.reported_problem)
      if (data.os.technical_diagnosis) kv(wsR, "Diagnóstico Técnico", data.os.technical_diagnosis)
      if (data.os.customer_notes)      kv(wsR, "Obs. Cliente",        data.os.customer_notes)
      if (data.os.internal_notes)      kv(wsR, "Notas Internas",      data.os.internal_notes)

      // ── Aba 2: Itens ─────────────────────────────────────────────────────
      if (data.items.length > 0) {
        const wsI = wb.addWorksheet("Itens")
        table(wsI, [
          { header: "Descrição",  key: "desc",  width: 40 },
          { header: "Tipo",       key: "type",  width: 12, align: "center" },
          { header: "Qtd",        key: "qty",   width: 7,  align: "center", fmt: FMT.int },
          { header: "Unitário",   key: "unit",  width: 16, align: "right",  fmt: FMT.brl },
          { header: "Total",      key: "total", width: 16, align: "right",  fmt: FMT.brl, color: C.green },
        ], data.items.map((item) => ({
          desc:  item.description,
          type:  ITEM_TYPE_LABELS[item.item_type] ?? item.item_type,
          qty:   item.quantity,
          unit:  item.unit_price,
          total: item.total,
        })))
      }

      // ── Aba 3: Checklist ──────────────────────────────────────────────────
      if (data.checklist.length > 0) {
        const wsC = wb.addWorksheet("Checklist")
        table(wsC, [
          { header: "Item",       key: "label", width: 30 },
          { header: "Resposta",   key: "value", width: 20 },
          { header: "Observação", key: "notes", width: 40 },
        ], data.checklist.map((c) => ({
          label: c.label,
          value: c.value ?? "",
          notes: c.notes ?? "",
        })))
      }

      // ── Aba 4: Pagamentos ─────────────────────────────────────────────────
      if (data.payments.length > 0) {
        const wsP = wb.addWorksheet("Pagamentos")
        table(wsP, [
          { header: "Método",   key: "method", width: 22 },
          { header: "Parcelas", key: "inst",   width: 10, align: "center", fmt: FMT.int },
          { header: "Valor",    key: "amount", width: 16, align: "right",  fmt: FMT.brl, color: C.green },
          { header: "Data",     key: "dt",     width: 14, align: "center", fmt: FMT.date },
        ], data.payments.map((p) => ({
          method: METHOD_LABELS[p.method] ?? p.method,
          inst:   p.installments,
          amount: p.amount,
          dt:     p.paid_at ? new Date(p.paid_at) : "",
        })))
      }

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${orderNumber.toLowerCase()}.xlsx`
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
      <Button variant="outline" size="sm" onClick={handleDownloadXlsx} disabled={loadingXlsx || loadingPdf}>
        {loadingXlsx ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sheet className="mr-1.5 h-4 w-4" />}
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={loadingPdf || loadingXlsx}>
        {loadingPdf ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
        PDF
      </Button>
    </div>
  )
}
