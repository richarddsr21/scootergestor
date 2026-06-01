"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateThemeSettingsAction } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"

interface Props {
  theme: Tables<"company_theme_settings"> | null
}

export function AparenciaForm({ theme }: Props) {
  const [state, formAction, pending] = useActionState(updateThemeSettingsAction, {})

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) toast.success(state.success)
  }, [state])

  return (
    <form action={formAction} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="app_display_name">Nome exibido no sistema</Label>
        <Input
          id="app_display_name"
          name="app_display_name"
          placeholder="ScooterGestor"
          defaultValue={theme?.app_display_name ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Nome que aparece no cabeçalho e aba do navegador.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_color">Cor primária</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              id="primary_color"
              name="primary_color"
              defaultValue={theme?.primary_color ?? "#6366f1"}
              className="h-9 w-16 cursor-pointer rounded-md border border-input bg-background p-1"
            />
            <Input
              name="primary_color_text"
              placeholder="#6366f1"
              defaultValue={theme?.primary_color ?? "#6366f1"}
              className="font-mono text-sm"
              readOnly
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondary_color">Cor secundária</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              id="secondary_color"
              name="secondary_color"
              defaultValue={theme?.secondary_color ?? "#8b5cf6"}
              className="h-9 w-16 cursor-pointer rounded-md border border-input bg-background p-1"
            />
            <Input
              placeholder="#8b5cf6"
              defaultValue={theme?.secondary_color ?? "#8b5cf6"}
              className="font-mono text-sm"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme_mode">Tema padrão</Label>
        <Select name="theme_mode" defaultValue={theme?.theme_mode ?? "system"}>
          <SelectTrigger id="theme_mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Claro</SelectItem>
            <SelectItem value="dark">Escuro</SelectItem>
            <SelectItem value="system">Seguir sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar aparência"}
        </Button>
      </div>
    </form>
  )
}
