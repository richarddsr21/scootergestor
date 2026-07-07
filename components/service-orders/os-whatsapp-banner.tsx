"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cleanWhatsappPhone } from "@/lib/whatsapp-template"

interface Props {
  customerName: string
  customerWhatsapp: string | null
  orderNumber: string
  message: string
}

export function OsWhatsAppBanner({ customerName, customerWhatsapp, orderNumber, message }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const triggered = useRef(false)

  function openWhatsApp() {
    if (!customerWhatsapp) return
    const phone = cleanWhatsappPhone(customerWhatsapp)
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  useEffect(() => {
    if (!customerWhatsapp || triggered.current) return
    triggered.current = true
    openWhatsApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerWhatsapp])

  function handleDismiss() {
    router.replace(pathname)
  }

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <MessageCircle className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-emerald-900">Enviar OS para o cliente</h3>
          <p className="mt-0.5 text-sm text-emerald-700">
            {customerWhatsapp
              ? `Abrimos o WhatsApp para você enviar a ${orderNumber} para ${customerName}. Se não abriu, use o botão abaixo.`
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
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
