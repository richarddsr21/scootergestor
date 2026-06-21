"use client"

import { useEffect, useRef } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface QuoteItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Props {
  customerName: string
  customerWhatsapp: string | null
  quoteNumber: string
  subtotal: number
  discount: number
  total: number
  items: QuoteItem[]
  validUntil?: string | null
  notes?: string | null
  vehicleBrand?: string | null
  vehicleModel?: string | null
  storeName: string
  appUrl: string
  orderNumber?: string
  trackingToken?: string
  osId?: string
  autoOpen?: boolean
}

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  return `55${digits}`
}

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function buildMessage(params: {
  customerName: string
  quoteNumber: string
  subtotal: number
  discount: number
  total: number
  items: QuoteItem[]
  validUntil?: string | null
  notes?: string | null
  vehicle: string
  orderNumber?: string
  trackingUrl: string | null
  storeName: string
}): string {
  const { customerName, quoteNumber, subtotal, discount, total, items, validUntil, notes, vehicle, orderNumber, trackingUrl, storeName } = params

  const itemLines = items.map(i => {
    const qty = i.quantity % 1 === 0 ? String(Math.round(i.quantity)) : String(i.quantity)
    if (i.quantity === 1) return `  • ${i.description} — ${fmtBRL(i.total)}`
    return `  • ${qty}x ${i.description} — ${fmtBRL(i.total)} (${fmtBRL(i.unit_price)} un.)`
  }).join("\n")

  const sep = "-------------------"

  const lines: string[] = [
    `Olá, ${customerName}! 👋`,
    "",
    `Seu orçamento *${quoteNumber}* está pronto! Confira os detalhes:`,
  ]

  if (vehicle) lines.push(`🛵 Veículo: ${vehicle}`)
  if (orderNumber) lines.push(`📋 OS vinculada: ${orderNumber}`)

  lines.push("", `*Itens do orçamento:*`, itemLines, "", sep)

  if (discount > 0) {
    lines.push(`Subtotal: ${fmtBRL(subtotal)}`)
    lines.push(`Desconto: −${fmtBRL(discount)}`)
  }

  lines.push(`💰 *Total: ${fmtBRL(total)}*`)

  if (validUntil) lines.push(`📅 Válido até: ${fmtDate(validUntil)}`)

  lines.push(sep)

  if (notes) lines.push("", `📝 *Observações:*`, notes)

  if (trackingUrl) lines.push("", `Acompanhe e responda pelo link:`, `👉 ${trackingUrl}`)

  lines.push("", `Qualquer dúvida, é só chamar! 😊`, `— ${storeName}`)

  return lines.join("\n")
}

export function WhatsAppActions({
  customerName,
  customerWhatsapp,
  quoteNumber,
  subtotal,
  discount,
  total,
  items,
  validUntil,
  notes,
  vehicleBrand,
  vehicleModel,
  storeName,
  appUrl,
  orderNumber,
  trackingToken,
  osId,
  autoOpen = false,
}: Props) {
  const router = useRouter()
  const triggered = useRef(false)

  const vehicle = [vehicleBrand, vehicleModel].filter(Boolean).join(" ")
  const trackingUrl = trackingToken ? `${appUrl}/acompanhar/${trackingToken}` : null

  const message = buildMessage({ customerName, quoteNumber, subtotal, discount, total, items, validUntil, notes, vehicle, orderNumber, trackingUrl, storeName })

  function openWhatsApp() {
    if (!customerWhatsapp) return
    const phone = cleanPhone(customerWhatsapp)
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  useEffect(() => {
    if (!autoOpen || !customerWhatsapp || triggered.current) return
    triggered.current = true
    openWhatsApp()
  }, [autoOpen, customerWhatsapp]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismiss() {
    if (osId) router.push(`/oficina/${osId}`)
    else router.back()
  }

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <MessageCircle className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-emerald-900">Enviar orçamento para o cliente?</h3>
          <p className="mt-0.5 text-sm text-emerald-700">
            {customerWhatsapp
              ? `O orçamento ${quoteNumber} será enviado via WhatsApp para ${customerName}.`
              : "O cliente não tem WhatsApp cadastrado. Cadastre na ficha do cliente para enviar."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {customerWhatsapp ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={openWhatsApp}
              >
                <MessageCircle className="size-4" />
                Enviar no WhatsApp
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                <MessageCircle className="size-4 mr-1.5" />
                WhatsApp não cadastrado
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-700 hover:text-emerald-900 gap-1"
              onClick={handleDismiss}
            >
              <X className="size-4" />
              Não enviar
            </Button>
          </div>

          {trackingUrl && (
            <p className="mt-3 text-xs text-emerald-600 break-all">
              Link de acompanhamento: {trackingUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
