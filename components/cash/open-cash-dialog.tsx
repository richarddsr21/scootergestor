"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { openCashRegisterAction } from "@/lib/actions/cash"
import { PlusCircle } from "lucide-react"

const INIT = { error: undefined, success: undefined }

export function OpenCashDialog() {
  const [state, action, pending] = useActionState(openCashRegisterAction, INIT)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) toast.success(state.success)
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Abrir Caixa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Abrir caixa</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={action} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="initial_amount">Fundo de caixa (R$)</Label>
            <Input
              id="initial_amount"
              name="initial_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              defaultValue="0"
              required
            />
            <p className="text-xs text-muted-foreground">Valor em dinheiro que já está na gaveta ao abrir.</p>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Abrindo..." : "Abrir caixa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
