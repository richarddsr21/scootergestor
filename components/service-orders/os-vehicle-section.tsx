"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, X, Check } from "lucide-react"
import { updateOsVehicleInfoAction } from "@/lib/actions/service-orders"

interface Props {
  osId: string
  vehicleBrand: string | null
  vehicleModel: string | null
  vehicleChassis: string | null
  mileageKm: number | null
}

export function OsVehicleSection({ osId, vehicleBrand, vehicleModel, vehicleChassis, mileageKm }: Props) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState({
    vehicle_brand: vehicleBrand ?? "",
    vehicle_model: vehicleModel ?? "",
    vehicle_chassis: vehicleChassis ?? "",
    mileage_km: mileageKm != null ? String(mileageKm) : "",
  })

  function handleSave() {
    startTransition(async () => {
      const res = await updateOsVehicleInfoAction(osId, values)
      if (res.error) toast.error(res.error)
      else {
        toast.success(res.success)
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setValues({
      vehicle_brand: vehicleBrand ?? "",
      vehicle_model: vehicleModel ?? "",
      vehicle_chassis: vehicleChassis ?? "",
      mileage_km: mileageKm != null ? String(mileageKm) : "",
    })
    setEditing(false)
  }

  const hasData = vehicleBrand || vehicleModel || vehicleChassis || mileageKm != null

  if (!editing) {
    return (
      <div className="space-y-2 text-sm">
        {hasData ? (
          <>
            {(vehicleBrand || vehicleModel) && (
              <p className="font-medium">{[vehicleBrand, vehicleModel].filter(Boolean).join(" ")}</p>
            )}
            {vehicleChassis && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chassi</span>
                <span className="font-mono text-xs">{vehicleChassis}</span>
              </div>
            )}
            {mileageKm != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quilometragem</span>
                <span>{mileageKm.toLocaleString("pt-BR")} km</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-xs">Nenhum dado de scooter informado.</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs mt-1"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3 mr-1" />
          {hasData ? "Editar" : "Adicionar"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Marca</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Ex: Garelli, Xiaomi..."
            value={values.vehicle_brand}
            onChange={e => setValues(v => ({ ...v, vehicle_brand: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Modelo</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Ex: X11, X13, STREET..."
            value={values.vehicle_model}
            onChange={e => setValues(v => ({ ...v, vehicle_model: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nº de chassi</Label>
          <Input
            className="h-8 text-sm font-mono"
            placeholder="Ex: 9C2JC30..."
            value={values.vehicle_chassis}
            onChange={e => setValues(v => ({ ...v, vehicle_chassis: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Quilometragem</Label>
          <Input
            className="h-8 text-sm"
            type="number"
            min="0"
            placeholder="Ex: 1250"
            value={values.mileage_km}
            onChange={e => setValues(v => ({ ...v, mileage_km: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave} disabled={pending}>
          <Check className="h-3 w-3 mr-1" />
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleCancel} disabled={pending}>
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
