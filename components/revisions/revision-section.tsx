"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bell, Plus, X, BellOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  addRevisionReminderAction,
  cancelRevisionAction,
  deleteRevisionReminderAction,
  type RevisionSchedule,
} from "@/lib/actions/revisions"

function fmtDate(d: string) {
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function AddReminderDialog({
  customerId,
  sourceOsId,
  sourceSaleId,
  onSuccess,
}: {
  customerId: string
  sourceOsId?: string | null
  sourceSaleId?: string | null
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [remindOn, setRemindOn] = useState("")
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [notifyStore, setNotifyStore] = useState(true)

  function handleSave() {
    if (!remindOn) {
      toast.error("Selecione uma data")
      return
    }
    startTransition(async () => {
      const result = await addRevisionReminderAction({
        customerId,
        remindOn,
        notifyCustomer,
        notifyStore,
        sourceOsId: sourceOsId ?? null,
        sourceSaleId: sourceSaleId ?? null,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success)
        setOpen(false)
        setRemindOn("")
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-7">
          <Plus className="h-3 w-3 mr-1" />
          Adicionar lembrete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo lembrete de revisão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="remind_on">Data do lembrete</Label>
            <Input
              id="remind_on"
              type="date"
              value={remindOn}
              onChange={(e) => setRemindOn(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_customer" className="text-sm font-normal cursor-pointer">
                Notificar cliente (WhatsApp)
              </Label>
              <Switch
                id="notify_customer"
                checked={notifyCustomer}
                onCheckedChange={setNotifyCustomer}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_store" className="text-sm font-normal cursor-pointer">
                Notificar loja (sino)
              </Label>
              <Switch
                id="notify_store"
                checked={notifyStore}
                onCheckedChange={setNotifyStore}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isPending} className="w-full">
            Salvar lembrete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RevisionSection({
  customerId,
  initialRevision,
  sourceOsId,
  sourceSaleId,
}: {
  customerId: string
  initialRevision: RevisionSchedule | null
  sourceOsId?: string | null
  sourceSaleId?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const revision = initialRevision

  function refresh() {
    router.refresh()
  }

  function handleDelete(reminderId: string) {
    startTransition(async () => {
      const result = await deleteRevisionReminderAction(reminderId)
      if (result.error) toast.error(result.error)
      else {
        toast.success(result.success)
        router.refresh()
      }
    })
  }

  function handleCancel() {
    if (!revision) return
    startTransition(async () => {
      const result = await cancelRevisionAction(revision.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(result.success)
        router.refresh()
      }
    })
  }

  const pendingReminders = revision?.reminders.filter((r) => !r.sent_at) ?? []
  const sentReminders = revision?.reminders.filter((r) => r.sent_at) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Lembretes de revisão
        </CardTitle>
        {revision?.is_active ? (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">
            Ativa
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Inativa
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {revision?.is_active ? (
          <>
            <p className="text-xs text-muted-foreground">
              Ativa desde {fmtDate(revision.started_at.split("T")[0])}
            </p>

            {pendingReminders.length === 0 && sentReminders.length === 0 ? (
              <p className="text-muted-foreground text-xs">Nenhum lembrete configurado.</p>
            ) : (
              <div className="space-y-1.5">
                {pendingReminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{fmtDate(r.remind_on)}</span>
                      <span className="text-xs text-muted-foreground">
                        {[r.notify_customer && "Cliente", r.notify_store && "Loja"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(r.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {sentReminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="line-through text-xs">{fmtDate(r.remind_on)}</span>
                    <span className="text-xs">Enviado</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <AddReminderDialog
                customerId={customerId}
                sourceOsId={sourceOsId}
                sourceSaleId={sourceSaleId}
                onSuccess={refresh}
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground hover:text-destructive"
                  >
                    <BellOff className="h-3 w-3 mr-1" />
                    Cancelar revisão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar revisão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Os lembretes pendentes serão desativados. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isPending}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Cancelar revisão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              Nenhuma revisão ativa para este cliente.
            </p>
            <AddReminderDialog
              customerId={customerId}
              sourceOsId={sourceOsId}
              sourceSaleId={sourceSaleId}
              onSuccess={refresh}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
