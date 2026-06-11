"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateServiceOrderStatusAction } from "@/lib/actions/service-orders"
import { APP_URL } from "@/lib/constants"

interface Status {
  id: string
  name: string
  color: string
  slug: string
  is_final: boolean
}

interface Props {
  osId: string
  currentStatusId: string
  statuses: Status[]
  customerName?: string
  customerWhatsapp?: string | null
  orderNumber?: string
  trackingToken?: string | null
  storeName?: string
}

function cleanPhone(raw: string) {
  const digits = raw.replace(/\D/g, "")
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`
}

function buildStatusMessage(
  statusName: string,
  customerName: string,
  orderNumber: string,
  trackingToken: string | null,
  storeName: string
) {
  const trackingLine = trackingToken
    ? `\nAcompanhe em tempo real:\n${APP_URL}/acompanhar/${trackingToken}\n`
    : ""
  return (
    `Olá, ${customerName}! 👋\n\n` +
    `Atualização da sua scooter:\n` +
    `🔧 OS: ${orderNumber}\n` +
    `📋 Novo status: *${statusName}*\n` +
    trackingLine +
    `\n— ${storeName}`
  )
}

export function OsStatusSelector({
  osId,
  currentStatusId,
  statuses,
  customerName,
  customerWhatsapp,
  orderNumber,
  trackingToken,
  storeName = "ScooterGestor",
}: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(statusId: string) {
    startTransition(async () => {
      const result = await updateServiceOrderStatusAction(osId, statusId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Status atualizado")

      if (customerWhatsapp && customerName && orderNumber) {
        const statusObj = statuses.find((s) => s.id === statusId)
        if (statusObj) {
          const msg = buildStatusMessage(statusObj.name, customerName, orderNumber, trackingToken ?? null, storeName)
          window.open(`https://wa.me/${cleanPhone(customerWhatsapp)}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer")
        }
      }
    })
  }

  return (
    <Select value={currentStatusId} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger>
        <SelectValue placeholder="Selecionar status..." />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
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
