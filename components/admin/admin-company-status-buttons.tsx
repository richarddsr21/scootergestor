"use client"

import * as React from "react"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { adminSetCompanyStatusAction } from "@/lib/actions/admin"

export function AdminCompanyStatusButtons({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleClick(status: "active" | "suspended") {
    setError(null)
    startTransition(async () => {
      const result = await adminSetCompanyStatusAction(companyId, status)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleClick("active")}>
          Ativar manualmente
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleClick("suspended")}>
          Suspender manualmente
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
