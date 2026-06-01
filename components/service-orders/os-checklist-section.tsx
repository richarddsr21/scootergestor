"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare } from "lucide-react"
import { saveChecklistAnswerAction } from "@/lib/actions/service-orders"

interface ChecklistItem {
  id: string
  label: string
  value: string | null
}

const OPTIONS = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "na", label: "N/A" },
]

export function OsChecklistSection({ osId, items }: { osId: string; items: ChecklistItem[] }) {
  const [isPending, startTransition] = useTransition()

  function handleChange(itemId: string, value: string) {
    startTransition(async () => {
      const result = await saveChecklistAnswerAction(itemId, value, osId)
      if (result.error) toast.error(result.error)
    })
  }

  const done = items.filter(i => i.value !== null).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" />Checklist de entrada</span>
          <span className="text-xs text-muted-foreground font-normal">{done}/{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <span className="text-sm flex-1">{item.label}</span>
            <Select
              defaultValue={item.value ?? ""}
              onValueChange={(v) => handleChange(item.id, v)}
              disabled={isPending}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
