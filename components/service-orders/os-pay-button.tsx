"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Printer, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { OsPaymentDialog } from "@/components/service-orders/os-payment-dialog"
import {
  type ReceiptProps,
  buildThermalReceipt,
  buildPrintHTML,
  buildWhatsAppMessage,
  cleanPhone,
} from "@/lib/receipt-builder"

interface Props {
  osId: string
  alreadyPaid?: boolean
}

export function OsPayButton({ osId, alreadyPaid }: Props) {
  const router = useRouter()
  const [payOpen, setPayOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptProps | null>(null)

  // Already paid before this session and no local receipt — nothing to show
  if (alreadyPaid && !receipt) return null

  function handlePaySuccess(data: ReceiptProps) {
    setReceipt(data)
    router.refresh()
  }

  function handlePrint() {
    if (!receipt) return
    const text = buildThermalReceipt(receipt)
    const html = buildPrintHTML(text)
    const win = window.open("", "_blank", "width=480,height=700")
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  function handleWhatsApp() {
    if (!receipt?.customerWhatsapp) return
    const message = buildWhatsAppMessage(receipt)
    const url = `https://wa.me/${cleanPhone(receipt.customerWhatsapp)}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // After payment: show receipt action buttons in place of the pay button
  if (receipt) {
    return (
      <>
        <div className="flex gap-2 flex-wrap pt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 flex-1"
            onClick={() => setPreviewOpen(true)}
          >
            <Printer className="h-4 w-4" />
            Imprimir cupom
          </Button>

          {receipt.customerWhatsapp && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cupom Não Fiscal</DialogTitle>
              <DialogDescription>Clique em imprimir ou fechar.</DialogDescription>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh] rounded border bg-white p-4">
              <pre className="font-mono text-[11px] leading-tight whitespace-pre select-all text-black">
                {buildThermalReceipt(receipt)}
              </pre>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Fechar
              </Button>
              <Button
                onClick={handlePrint}
                className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Button size="sm" className="w-full gap-2" onClick={() => setPayOpen(true)}>
        <CreditCard className="size-4" />
        Fazer pagamento
      </Button>

      <OsPaymentDialog
        osId={osId}
        open={payOpen}
        onOpenChange={setPayOpen}
        onSuccess={handlePaySuccess}
      />
    </>
  )
}
