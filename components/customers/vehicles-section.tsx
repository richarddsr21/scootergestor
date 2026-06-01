"use client"

import { useState, useActionState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Bike, Pencil, Trash2 } from "lucide-react"
import { saveVehicleAction, deleteVehicleAction } from "@/lib/actions/customers"
import type { Tables } from "@/types/database"

type Vehicle = Tables<"vehicles">

const INIT = { error: undefined, success: undefined }

function VehicleForm({ vehicle, customerId, onClose }: {
  vehicle?: Vehicle
  customerId: string
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(saveVehicleAction, INIT)
  const formKey = useRef(0)

  useEffect(() => {
    if (state.success) { toast.success(state.success); onClose() }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
    <form key={formKey.current} action={action} className="space-y-4">
      <input type="hidden" name="customer_id" value={customerId} />
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="v-type">Tipo *</Label>
          <Input id="v-type" name="type" required defaultValue={vehicle?.type ?? ""} placeholder="Scooter, Patinete, Bike..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-brand">Marca</Label>
          <Input id="v-brand" name="brand" defaultValue={vehicle?.brand ?? ""} placeholder="Xiaomi, Segway..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-model">Modelo</Label>
          <Input id="v-model" name="model" defaultValue={vehicle?.model ?? ""} placeholder="M365, ES2..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-color">Cor</Label>
          <Input id="v-color" name="color" defaultValue={vehicle?.color ?? ""} placeholder="Preto, Branco..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-serial">Número de série</Label>
          <Input id="v-serial" name="serial_number" defaultValue={vehicle?.serial_number ?? ""} placeholder="Serial..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-battery">Tipo de bateria</Label>
          <Input id="v-battery" name="battery_type" defaultValue={vehicle?.battery_type ?? ""} placeholder="Lítio, Chumbo..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-voltage">Tensão</Label>
          <Input id="v-voltage" name="voltage" defaultValue={vehicle?.voltage ?? ""} placeholder="36V, 48V..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-power">Potência</Label>
          <Input id="v-power" name="power" defaultValue={vehicle?.power ?? ""} placeholder="250W, 500W..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-purchase">Data de compra</Label>
          <Input id="v-purchase" name="purchase_date" type="date" defaultValue={vehicle?.purchase_date ?? ""} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : vehicle ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  )
}

export function VehiclesSection({ vehicles, customerId }: { vehicles: Vehicle[]; customerId: string }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Veículos ({vehicles.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="h-3 w-3 mr-1" />Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {vehicles.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum veículo cadastrado.</p>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-2 p-2 rounded border bg-muted/20">
              <div className="flex items-start gap-2">
                <Bike className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{[v.brand, v.model].filter(Boolean).join(" ") || v.type}</p>
                  <p className="text-xs text-muted-foreground">{v.type}{v.color ? ` • ${v.color}` : ""}{v.voltage ? ` • ${v.voltage}` : ""}</p>
                  {v.serial_number && <p className="text-xs text-muted-foreground">Série: {v.serial_number}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(v); setOpen(true) }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover veículo?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const r = await deleteVehicleAction(v.id, customerId)
                          if (r.error) toast.error(r.error)
                          else toast.success(r.success ?? "Removido")
                        }}
                      >Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar veículo" : "Adicionar veículo"}</DialogTitle>
          </DialogHeader>
          <VehicleForm vehicle={editing ?? undefined} customerId={customerId} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
