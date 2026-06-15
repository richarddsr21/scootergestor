"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addSangriaAction } from "@/lib/actions/cash"
import { ArrowDownCircle } from "lucide-react"

const INIT = { error: undefined, success: undefined }

export function SangriaDialog() {
  const [state, action, pending] = useActionState(addSangriaAction, INIT)

  useEffect(() => {
    if (state.success) toast.success(state.success)
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
          Sangria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar sangria</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor retirado (R$)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Motivo</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Ex: pagamento de fornecedor..."
              rows={2}
            />
          </div>
          <Button type="submit" disabled={pending} variant="destructive" className="w-full">
            {pending ? "Registrando..." : "Confirmar sangria"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
