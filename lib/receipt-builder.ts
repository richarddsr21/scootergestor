import { PAYMENT_METHOD_LABELS } from "@/lib/constants"

export interface ReceiptItem {
  name: string
  sku: string | null
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface ReceiptPayment {
  method: string
  amount: number
  feeAmount: number
  installments: number | null
}

export interface ReceiptProps {
  saleNumber: string
  createdAt: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  payments: ReceiptPayment[]
  customerName: string
  customerWhatsapp: string | null
  storeName: string
  storeCnpj: string | null
  storePhone: string | null
  storeAddress?: string | null
}

function fmtNum(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  return `55${digits}`
}

export function buildThermalReceipt(p: ReceiptProps): string {
  const W = 46
  const heavy = "=".repeat(W)
  const light = "-".repeat(W)

  const date = new Date(p.createdAt)
  const dateLabel = date.toLocaleDateString("pt-BR")
  const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  function center(text: string): string {
    const pad = Math.max(0, Math.floor((W - text.length) / 2))
    return " ".repeat(pad) + text
  }

  function rpad(text: string, width: number): string {
    const t = text.length > width ? text.slice(0, width - 1) + "." : text
    return t.padEnd(width)
  }

  function lpad(text: string, width: number): string {
    return text.padStart(width)
  }

  const COL_NAME = 21
  const COL_QTD = 4
  const COL_UNIT = 9
  const COL_TOTAL = 9

  const itemHeader =
    rpad("ITEM", COL_NAME) +
    " " + lpad("QTD", COL_QTD) +
    " " + lpad("UNIT", COL_UNIT) +
    " " + lpad("TOTAL", COL_TOTAL)

  const itemLines = p.items
    .map((item) => {
      const nameStr = item.sku ? `${item.name} (${item.sku})` : item.name
      const name = rpad(nameStr, COL_NAME)
      const qty = lpad(`${item.quantity}x`, COL_QTD)
      const unit = lpad(fmtNum(item.unitPrice), COL_UNIT)
      const total = lpad(fmtNum(item.total), COL_TOTAL)
      const mainLine = `${name} ${qty} ${unit} ${total}`
      return item.discount > 0
        ? `${mainLine}\n  Desconto: -${fmtNum(item.discount)}`
        : mainLine
    })
    .join("\n")

  const LABEL_W = W - 11
  function totalRow(label: string, value: string): string {
    return rpad(label, LABEL_W) + lpad(value, 11)
  }

  const hasFees = p.payments.some((pay) => pay.feeAmount > 0)
  const totalPaidByClient = p.payments.reduce((sum, pay) => sum + pay.amount + pay.feeAmount, 0)

  const paymentLines = p.payments
    .map((pay) => {
      const label = PAYMENT_METHOD_LABELS[pay.method] ?? pay.method
      const inst = pay.installments && pay.installments > 1 ? ` (${pay.installments}x)` : ""
      const clientPaid = pay.amount + pay.feeAmount
      const rows = [totalRow(`${label}${inst}:`, `R$${fmtNum(clientPaid)}`)]
      if (pay.feeAmount > 0) {
        rows.push(totalRow("  Taxa maquininha:", `R$${fmtNum(pay.feeAmount)}`))
      }
      return rows.join("\n")
    })
    .join("\n")

  const lines: (string | null)[] = [
    heavy,
    center("CUPOM NAO FISCAL"),
    heavy,
    p.storeName ? center(p.storeName.toUpperCase()) : null,
    p.storeCnpj ? center(`CNPJ: ${p.storeCnpj}`) : null,
    p.storeAddress ? center(p.storeAddress) : null,
    p.storePhone ? center(`Tel: ${p.storePhone}`) : null,
    light,
    `Data: ${dateLabel}   Hora: ${timeLabel}`,
    `Venda: ${p.saleNumber}`,
    `Cliente: ${p.customerName}`,
    light,
    itemHeader,
    light,
    itemLines,
    light,
    totalRow("Subtotal:", `R$${fmtNum(p.subtotal)}`),
    p.discount > 0 ? totalRow("Desconto:", `-R$${fmtNum(p.discount)}`) : null,
    totalRow("TOTAL:", `R$${fmtNum(p.total)}`),
    light,
    "PAGAMENTO:",
    paymentLines,
    hasFees && p.payments.length > 1
      ? totalRow("Total cobrado:", `R$${fmtNum(totalPaidByClient)}`)
      : null,
    light,
    center("SEM VALOR FISCAL"),
    center("Obrigado pela preferencia!"),
    heavy,
  ]

  return lines.filter((l) => l !== null).join("\n")
}

export function buildPrintHTML(receipt: string): string {
  const escaped = receipt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cupom Não Fiscal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 11px; padding: 4mm; }
    pre { white-space: pre; line-height: 1.4; width: fit-content; }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`
}

export function buildWhatsAppMessage(p: ReceiptProps): string {
  return "```\n" + buildThermalReceipt(p) + "\n```"
}
