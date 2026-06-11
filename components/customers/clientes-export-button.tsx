"use client"

import { useState } from "react"
import { FileDown, Sheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { exportCustomersAction } from "@/lib/actions/customers"

export function ClientesExportButton({ companyName }: { companyName: string }) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  async function handleDownloadPdf() {
    setLoadingPdf(true)
    try {
      const customers = await exportCustomersAction()
      const [{ pdf }, { ClientesPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./clientes-pdf"),
      ])
      const blob = await pdf(ClientesPDF({ customers, companyName })).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes-${new Date().toISOString().slice(0, 10)}.pdf`
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
      const customers = await exportCustomersAction()
      const [{ default: ExcelJS }, { C, FMT, banner, section, kpiGrid, table, drow, hdr }] = await Promise.all([
        import("exceljs"),
        import("@/lib/xl"),
      ])

      const totalPago = customers.reduce((s, c) => s + c.total_pago, 0)
      const totalOs   = customers.reduce((s, c) => s + c.os_count, 0)
      const comOs     = customers.filter((c) => c.os_count > 0).length

      const wb = new ExcelJS.Workbook()
      wb.creator = companyName
      wb.created = new Date()

      // ── Aba 1: Clientes ───────────────────────────────────────────────────
      const wsC = wb.addWorksheet("Clientes", {
        pageSetup: { orientation: "landscape", fitToPage: true },
      })

      table(wsC, [
        { header: "#",            key: "idx",       width: 5,  align: "center" },
        { header: "Nome",         key: "name",      width: 34 },
        { header: "Telefone",     key: "phone",     width: 16 },
        { header: "WhatsApp",     key: "whatsapp",  width: 16 },
        { header: "E-mail",       key: "email",     width: 30 },
        { header: "CPF / CNPJ",   key: "cpfcnpj",  width: 18 },
        { header: "Endereço",     key: "address",   width: 28 },
        { header: "Cidade",       key: "city",      width: 18 },
        { header: "UF",           key: "state",     width: 5,  align: "center" },
        { header: "Qtd OS",       key: "os_count",  width: 9,  align: "center", fmt: FMT.int },
        { header: "Total Pago",   key: "total_pago",width: 16, align: "right",  fmt: FMT.brl, color: C.green },
        { header: "Cadastro",     key: "dt",        width: 12, align: "center", fmt: FMT.date },
      ], customers.map((c, i) => ({
        idx:       i + 1,
        name:      c.name,
        phone:     c.phone ?? "",
        whatsapp:  c.whatsapp ?? "",
        email:     c.email ?? "",
        cpfcnpj:   c.cpf_cnpj ?? "",
        address:   c.address ?? "",
        city:      c.city ?? "",
        state:     c.state ?? "",
        os_count:  c.os_count,
        total_pago: c.total_pago,
        dt:        c.created_at ? new Date(c.created_at) : "",
      })))

      // ── Aba 2: Resumo ─────────────────────────────────────────────────────
      const wsR = wb.addWorksheet("Resumo")
      wsR.columns = [
        { width: 22 }, { width: 16 }, { width: 16 }, { width: 22 }, { width: 24 },
      ]

      banner(wsR, `${companyName} — Relatório de Clientes`, 5)
      banner(wsR, `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, 5, {
        height: 22, size: 9, bold: false, color: C.lime,
      })

      section(wsR, "INDICADORES GERAIS", 5)
      kpiGrid(wsR, [
        { label: "TOTAL DE CLIENTES",  value: customers.length },
        { label: "COM OS",             value: comOs },
        { label: "TOTAL DE OS",        value: totalOs },
        { label: "TOTAL RECEBIDO",     value: totalPago,  fmt: FMT.brl, color: C.green },
        { label: "TICKET MÉDIO",       value: customers.length > 0 ? totalPago / customers.length : 0, fmt: FMT.brl, color: C.green },
      ], 5)

      // Top 10 por total pago
      const top10 = [...customers]
        .sort((a, b) => b.total_pago - a.total_pago)
        .slice(0, 10)

      if (top10.length > 0) {
        section(wsR, "TOP 10 CLIENTES POR FATURAMENTO", 5)
        const nt = 4
        const topHeader = wsR.addRow(["#", "Nome", "Qtd OS", "Total Pago"])
        hdr(topHeader, nt)
        topHeader.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
        topHeader.getCell(3).alignment = { horizontal: "center", vertical: "middle" }
        topHeader.getCell(4).alignment = { horizontal: "right",  vertical: "middle" }

        top10.forEach((c, i) => {
          const row = wsR.addRow([i + 1, c.name, c.os_count, c.total_pago])
          drow(row, i, nt)
          row.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
          row.getCell(3).alignment = { horizontal: "center", vertical: "middle" }
          const cell4 = row.getCell(4)
          cell4.numFmt = FMT.brl
          cell4.alignment = { horizontal: "right", vertical: "middle" }
          cell4.font = { name: "Calibri", size: 9, color: { argb: C.green }, bold: true }
        })
      }

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`
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
