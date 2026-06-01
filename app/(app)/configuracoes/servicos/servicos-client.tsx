"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { saveServiceAction, deleteServiceAction } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"

type Service = Tables<"services">

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function formatMinutes(min: number) {
  if (!min) return "—"
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${m}min` : `${h}h`
}

export function ServicosClient({ servicos }: { servicos: Service[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Service | null>(null)
  const [saveState, formAction, pending] = useActionState(saveServiceAction, {})
  const formKey = React.useRef(0)

  React.useEffect(() => {
    if (saveState.error) { toast.error(saveState.error); return }
    if (saveState.success) {
      toast.success(saveState.success)
      setDialogOpen(false)
      setEditing(null)
      formKey.current++
    }
  }, [saveState])

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(s: Service) { setEditing(s); setDialogOpen(true) }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteServiceAction(deleteId)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Novo serviço
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço padrão</TableHead>
              <TableHead>Tempo estimado</TableHead>
              <TableHead>Garantia</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum serviço cadastrado.</TableCell>
              </TableRow>
            )}
            {servicos.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{formatCurrency(s.default_price)}</TableCell>
                <TableCell>{formatMinutes(s.estimated_minutes)}</TableCell>
                <TableCell>{s.warranty_days ? `${s.warranty_days} dias` : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <form key={formKey.current} action={formAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="space-y-2">
              <Label htmlFor="svc-name">Nome *</Label>
              <Input id="svc-name" name="name" defaultValue={editing?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Descrição</Label>
              <Textarea id="svc-desc" name="description" rows={2} defaultValue={editing?.description ?? ""} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="svc-price">Preço (R$)</Label>
                <Input id="svc-price" name="default_price" type="number" min="0" step="0.01" defaultValue={editing?.default_price ?? 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-time">Tempo (min)</Label>
                <Input id="svc-time" name="estimated_minutes" type="number" min="0" defaultValue={editing?.estimated_minutes ?? 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-warranty">Garantia (dias)</Label>
                <Input id="svc-warranty" name="warranty_days" type="number" min="0" defaultValue={editing?.warranty_days ?? 0} />
              </div>
            </div>
            {saveState.error && <p className="text-sm text-destructive">{saveState.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
