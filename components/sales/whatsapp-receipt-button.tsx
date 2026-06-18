"use client"

import { useState } from "react"
import { MessageCircle, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  type ReceiptProps,
  buildThermalReceipt,
  buildPrintHTML,
  buildWhatsAppMessage,
  cleanPhone,
} from "@/lib/receipt-builder"

// Re-export for consumers that import individual interfaces from here
export type { ReceiptProps }

// Alias matching old props shape used by the sales page
interface Props extends ReceiptProps {}

export function SaleReceiptButtons(props: Props) {
  const [open, setOpen] = useState(false)
  const receipt = buildThermalReceipt(props)

  function handlePrint() {
    const html = buildPrintHTML(receipt)
    const win = window.open("", "_blank", "width=480,height=700")
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  function handleWhatsApp() {
    if (!props.customerWhatsapp) return
    const message = buildWhatsAppMessage(props)
    const url = `https://wa.me/${cleanPhone(props.customerWhatsapp)}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Printer className="h-4 w-4" />
        Imprimir cupom
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        disabled={!props.customerWhatsapp}
        title={
          props.customerWhatsapp
            ? "Enviar cupom por WhatsApp"
            : "Cliente sem WhatsApp cadastrado"
        }
        onClick={handleWhatsApp}
      >
        <MessageCircle className="h-4 w-4" />
        Enviar por WhatsApp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cupom Não Fiscal</DialogTitle>
            <DialogDescription>Clique em imprimir ou fechar.</DialogDescription>
          </DialogHeader>

          <div className="overflow-auto max-h-[60vh] rounded border bg-white p-4">
            <pre className="font-mono text-[11px] leading-tight whitespace-pre select-all text-black">
              {receipt}
            </pre>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
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

export { SaleReceiptButtons as WhatsAppReceiptButton }
