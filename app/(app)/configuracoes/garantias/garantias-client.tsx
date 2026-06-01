"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { saveWarrantyRuleAction, deleteWarrantyRuleAction } from "@/lib/actions/settings"
import { WARRANTY_TYPES } from "@/lib/constants"
import type { Tables } from "@/types/database"

type Rule = Tables<"warranty_rules">

const WARRANTY_TYPE_LABELS: Record<string, string> = {
  servico: "Serviço",
  produto: "Produto",
  bateria: "Bateria",
  scooter: "Scooter",
  carregador: "Carregador",
}

export function GarantiasClient({ regras }: { regras: Rule[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Rule | null>(null)
  const [saveState, formAction, pending] = useActionState(saveWarrantyRuleAction, {})
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
  function openEdit(r: Rule) { setEditing(r); setDialogOpen(true) }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteWarrantyRuleAction(deleteId)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nova regra
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {regras.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma regra cadastrada.</TableCell>
              </TableRow>
            )}
            {regras.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{WARRANTY_TYPE_LABELS[r.warranty_type] ?? r.warranty_type}</TableCell>
                <TableCell>{r.duration_days} dias</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar regra" : "Nova regra"}</DialogTitle>
          </DialogHeader>
          <form key={formKey.current} action={formAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="space-y-2">
              <Label htmlFor="wr-name">Nome *</Label>
              <Input id="wr-name" name="name" defaultValue={editing?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wr-type">Tipo</Label>
              <Select name="warranty_type" defaultValue={editing?.warranty_type ?? "servico"}>
                <SelectTrigger id="wr-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WARRANTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{WARRANTY_TYPE_LABELS[t] ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wr-days">Prazo (dias) *</Label>
              <Input id="wr-days" name="duration_days" type="number" min="1" defaultValue={editing?.duration_days ?? 30} required />
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
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
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
