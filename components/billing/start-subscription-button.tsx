// components/billing/start-subscription-button.tsx
"use client"

import * as React from "react"
import { useActionState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { startSubscriptionAction, type BillingActionState } from "@/lib/actions/billing"

const initialState: BillingActionState = {}

export function StartSubscriptionButton() {
  const [state, formAction, isPending] = useActionState(startSubscriptionAction, initialState)

  React.useEffect(() => {
    if (state.checkoutUrl) {
      window.location.href = state.checkoutUrl
    }
  }, [state.checkoutUrl])

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={isPending} className="w-full gap-2">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isPending ? "Preparando pagamento..." : "Ir para pagamento"}
      </Button>
    </form>
  )
}
