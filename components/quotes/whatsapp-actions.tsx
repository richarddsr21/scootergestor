"use client"

import { useEffect, useRef } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Props {
  customerName: string
  customerWhatsapp: string | null
  quoteNumber: string
  total: number
  storeName: string
  appUrl: string
  // OS-linked fields (optional — only for quotes created from an OS)
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

export function WhatsAppActions({
  customerName,
  customerWhatsapp,
  quoteNumber,
  total,
  storeName,
  appUrl,
  orderNumber,
  trackingToken,
  osId,
  autoOpen = false,
}: Props) {
  const router = useRouter()
  const triggered = useRef(false)

  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)

  const trackingUrl = trackingToken ? `${appUrl}/acompanhar/${trackingToken}` : null

  const message =
    `Olá, ${customerName}! 👋\n\n` +
    `Seu orçamento está pronto!\n\n` +
    (orderNumber ? `📋 OS: ${orderNumber}\n` : "") +
    `💰 Total: ${valor}\n` +
    (trackingUrl ? `\nAcompanhe em tempo real:\n${trackingUrl}\n` : "") +
    `\n— ${storeName}`

  useEffect(() => {
    if (!autoOpen || !customerWhatsapp || triggered.current) return
    triggered.current = true
    window.open(
      `https://wa.me/${cleanPhone(customerWhatsapp)}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }, [autoOpen, customerWhatsapp]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend() {
    if (!customerWhatsapp) return
    const phone = cleanPhone(customerWhatsapp)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

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
                onClick={handleSend}
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
