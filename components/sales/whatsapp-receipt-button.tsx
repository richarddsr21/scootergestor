"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"

interface ReceiptItem {
  name: string
  sku: string | null
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface ReceiptPayment {
  method: string
  amount: number
  feeAmount: number
  installments: number | null
}

interface Props {
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
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  return `55${digits}`
}

function buildMessage(p: Props): string {
  const date = new Date(p.createdAt)
  const dateLabel = date.toLocaleDateString("pt-BR")
  const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  const itemLines = p.items
    .map((item) => {
      const qty = item.quantity.toString().padStart(2, " ")
      const nameLine = item.sku ? `${item.name} (${item.sku})` : item.name
      const calc = `${qty}x ${fmt(item.unitPrice)} = ${fmt(item.total)}`
      return item.discount > 0
        ? `${nameLine}\n   ${calc}  (desc. -${fmt(item.discount)})`
        : `${nameLine}\n   ${calc}`
    })
    .join("\n")

  const hasFees = p.payments.some((pay) => pay.feeAmount > 0)
  const paymentLines = p.payments
    .map((pay) => {
      const label = PAYMENT_METHOD_LABELS[pay.method] ?? pay.method
      const installments = pay.installments && pay.installments > 1 ? ` (${pay.installments}x)` : ""
      const clientPaid = pay.amount + pay.feeAmount
      return pay.feeAmount > 0
        ? `${label}${installments}: ${fmt(clientPaid)} (taxa maquininha: ${fmt(pay.feeAmount)})`
        : `${label}${installments}: ${fmt(clientPaid)}`
    })
    .join("\n")
  const totalPaidByClient = p.payments.reduce((sum, pay) => sum + pay.amount + pay.feeAmount, 0)

  const lines = [
    "🧾 *CUPOM NÃO FISCAL*",
    `*${p.storeName}*`,
    p.storeCnpj ? `CNPJ: ${p.storeCnpj}` : null,
    p.storePhone ? `📞 ${p.storePhone}` : null,
    "```",
    "————————————————————",
    `Data: ${dateLabel} às ${timeLabel}`,
    `Venda: ${p.saleNumber}`,
    "————————————————————",
    itemLines,
    "————————————————————",
    `Subtotal: ${fmt(p.subtotal)}`,
    p.discount > 0 ? `Desconto: -${fmt(p.discount)}` : null,
    `TOTAL: ${fmt(p.total)}`,
    "————————————————————",
    paymentLines ? `Pagamento:\n${paymentLines}` : null,
    hasFees ? `Total pago: ${fmt(totalPaidByClient)}` : null,
    "```",
    `Obrigado pela compra, ${p.customerName}! 🙏`,
    "",
    "_Este documento não possui valor fiscal e serve apenas como recibo de compra._",
    "",
    `— ${p.storeName}`,
  ]

  return lines.filter((l) => l !== null).join("\n")
}

export function WhatsAppReceiptButton(props: Props) {
  const phone = props.customerWhatsapp

  function handleSend() {
    if (!phone) return
    const message = buildMessage(props)
    const url = `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
      disabled={!phone}
      title={phone ? "Enviar cupom não fiscal por WhatsApp" : "Cliente sem WhatsApp cadastrado"}
      onClick={handleSend}
    >
      <MessageCircle className="h-4 w-4" />
      Enviar cupom
    </Button>
  )
}
