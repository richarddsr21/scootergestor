"use client"

import { useState } from "react"
import { FileDown, Sheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { exportOrcamentoAction } from "@/lib/actions/quotes"

const ITEM_TYPE_LABELS: Record<string, string> = { part: "Peça", service: "Serviço", labor: "M.O." }
const STATUS_LABELS: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado", expirado: "Expirado" }

interface Props {
  quoteId: string
  quoteNumber: string
}

export function OrcamentoExportButton({ quoteId, quoteNumber }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  async function handleDownloadPdf() {
    setLoadingPdf(true)
    try {
      const data = await exportOrcamentoAction(quoteId)
      if (!data) throw new Error("Sem dados")

      const [{ pdf }, { OrcamentoPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./orcamento-pdf"),
      ])
      const blob = await pdf(OrcamentoPDF({ data })).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${quoteNumber.toLowerCase()}.pdf`
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
      const data = await exportOrcamentoAction(quoteId)
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

      banner(wsR, `${data.companyName} — Orçamento`, 5)
      banner(wsR, data.quote.quote_number, 5, { height: 28, size: 13, bold: true, color: C.lime })
      banner(wsR, `Gerado em ${gerado}`, 5, { height: 20, size: 9, bold: false, color: C.lime })

      section(wsR, "DADOS DO ORÇAMENTO", 5)
      kv(wsR, "Número",   data.quote.quote_number)
      kv(wsR, "Status",   STATUS_LABELS[data.quote.status] ?? data.quote.status)
      kv(wsR, "Emissão",  new Date(data.quote.created_at), FMT.date)
      if (data.quote.valid_until)  kv(wsR, "Válido até",  new Date(data.quote.valid_until), FMT.date)
      if (data.quote.approved_at)  kv(wsR, "Aprovado em", new Date(data.quote.approved_at), FMT.date)
      if (data.quote.rejected_at)  kv(wsR, "Rejeitado em",new Date(data.quote.rejected_at), FMT.date)
      if (data.os)                 kv(wsR, "OS vinculada", data.os.order_number)

      section(wsR, "CLIENTE", 5)
      if (data.customer) {
        kv(wsR, "Nome",     data.customer.name)
        if (data.customer.whatsapp) kv(wsR, "WhatsApp", data.customer.whatsapp)
        if (data.customer.phone)    kv(wsR, "Telefone", data.customer.phone)
        if (data.customer.email)    kv(wsR, "E-mail",   data.customer.email)
        if (data.customer.cpf_cnpj) kv(wsR, "CPF/CNPJ",data.customer.cpf_cnpj)
      }

      section(wsR, "FINANCEIRO", 5)
      kv(wsR, "Subtotal", data.quote.subtotal, FMT.brl)
      if (data.quote.discount > 0)
        kv(wsR, "Desconto", data.quote.discount, FMT.brl)
      kv(wsR, "Total",    data.quote.total,    FMT.brl)
      if (data.quote.notes) kv(wsR, "Observações", data.quote.notes)

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

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${quoteNumber.toLowerCase()}.xlsx`
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
