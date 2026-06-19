"use client"

import { useState, useTransition } from "react"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { quickCreateCustomerAction } from "@/lib/actions/customers"

interface Props {
  onCreated: (customer: { id: string; name: string }) => void
  triggerSize?: "sm" | "default"
}

export function QuickCustomerDialog({ onCreated, triggerSize = "sm" }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await quickCreateCustomerAction({ name, phone, whatsapp })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cliente cadastrado")
        onCreated({ id: result.id!, name: name.trim() })
        setOpen(false)
        setName("")
        setPhone("")
        setWhatsapp("")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size={triggerSize} className="shrink-0">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cadastro rápido de cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="qc_name">Nome *</Label>
            <Input
              id="qc_name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Nome completo"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qc_phone">Telefone</Label>
            <Input
              id="qc_phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              type="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qc_whatsapp">WhatsApp</Label>
            <Input
              id="qc_whatsapp"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="(00) 00000-0000"
              type="tel"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Salvando..." : "Cadastrar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
