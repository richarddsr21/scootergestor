"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OsPaymentDialog } from "@/components/service-orders/os-payment-dialog"

interface Props {
  osId: string
}

export function OsPayButton({ osId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" className="w-full gap-2" onClick={() => setOpen(true)}>
        <CreditCard className="size-4" />
        Fazer pagamento
      </Button>

      <OsPaymentDialog osId={osId} open={open} onOpenChange={setOpen} />
    </>
  )
}
