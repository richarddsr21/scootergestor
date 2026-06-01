"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { updateWarrantyStatusAction } from "@/lib/actions/warranties"

type Status = "active" | "expired" | "claimed"

interface Props {
  id: string
  current: Status
}

const NEXT_ACTIONS: Record<Status, { label: string; next: Status; variant: "outline" | "destructive" | "default" }[]> = {
  active: [
    { label: "Marcar como acionada", next: "claimed", variant: "outline" },
    { label: "Marcar como expirada", next: "expired", variant: "outline" },
  ],
  claimed: [
    { label: "Reativar garantia", next: "active", variant: "outline" },
  ],
  expired: [
    { label: "Reativar garantia", next: "active", variant: "outline" },
  ],
}

export function WarrantyStatusButton({ id, current }: Props) {
  const [isPending, startTransition] = useTransition()

  function update(next: Status) {
    startTransition(async () => {
      const result = await updateWarrantyStatusAction(id, next)
      if (result.error) toast.error(result.error)
      else toast.success(result.success)
    })
  }

  const actions = NEXT_ACTIONS[current] ?? []

  return (
    <>
      {actions.map((a) => (
        <Button
          key={a.next}
          variant={a.variant}
          size="sm"
          disabled={isPending}
          onClick={() => update(a.next)}
        >
          {a.label}
        </Button>
      ))}
    </>
  )
}
