"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { approveQuoteAction, rejectQuoteAction } from "@/lib/actions/quotes"

interface Props {
  quoteId: string
  osId: string
}

export function QuoteStatusActions({ quoteId, osId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveQuoteAction(quoteId, osId)
      if (result.error) toast.error(result.error)
      else toast.success(result.success ?? "Aprovado")
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectQuoteAction(quoteId)
      if (result.error) toast.error(result.error)
      else toast.success(result.success ?? "Rejeitado")
    })
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
        disabled={isPending}
        onClick={handleApprove}
      >
        <CheckCircle className="size-4" />
        Aprovar orçamento
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
        disabled={isPending}
        onClick={handleReject}
      >
        <XCircle className="size-4" />
        Rejeitar
      </Button>
    </div>
  )
}
