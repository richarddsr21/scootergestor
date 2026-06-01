"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateServiceOrderStatusAction } from "@/lib/actions/service-orders"

interface Status {
  id: string
  name: string
  color: string
  slug: string
  is_final: boolean
}

export function OsStatusSelector({
  osId,
  currentStatusId,
  statuses,
}: {
  osId: string
  currentStatusId: string
  statuses: Status[]
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(statusId: string) {
    startTransition(async () => {
      const result = await updateServiceOrderStatusAction(osId, statusId)
      if (result.error) toast.error(result.error)
      else toast.success(result.success ?? "Status atualizado")
    })
  }

  return (
    <Select value={currentStatusId} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger>
        <SelectValue placeholder="Selecionar status..." />
      </SelectTrigger>
      <SelectContent>
        {statuses.map(s => (
          <SelectItem key={s.id} value={s.id}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
