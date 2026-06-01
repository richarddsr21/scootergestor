"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { saveChecklistItemAction, deleteChecklistItemAction } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"

type Item = Tables<"checklist_template_items">

const INPUT_TYPE_LABELS: Record<string, string> = {
  yes_no_na: "Sim/Não/N/A",
  text: "Texto",
  number: "Número",
  checkbox: "Caixa de seleção",
}

interface Props {
  items: Item[]
  templateId: string | null
}

export function ChecklistClient({ items, templateId }: Props) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Item | null>(null)
  const [required, setRequired] = React.useState(false)
  const [saveState, formAction, pending] = useActionState(saveChecklistItemAction, {})
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

  function openCreate() {
    setEditing(null)
    setRequired(false)
    setDialogOpen(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    setRequired(item.required)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteChecklistItemAction(deleteId)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
    setDeleteId(null)
  }

  if (!templateId) {
    return (
      <p className="text-sm text-muted-foreground">
        Checklist padrão não encontrado. Verifique se o setup da empresa foi concluído.
      </p>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Novo item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo de resposta</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum item no checklist.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{INPUT_TYPE_LABELS[item.input_type] ?? item.input_type}</Badge>
                </TableCell>
                <TableCell>{item.required ? "Sim" : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
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
            <DialogTitle>{editing ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          <form key={formKey.current} action={formAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <input type="hidden" name="template_id" value={templateId} />
            <input type="hidden" name="required" value={required ? "true" : "false"} />
            <div className="space-y-2">
              <Label htmlFor="cl-label">Descrição *</Label>
              <Input id="cl-label" name="label" defaultValue={editing?.label ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-type">Tipo de resposta</Label>
              <Select name="input_type" defaultValue={editing?.input_type ?? "yes_no_na"}>
                <SelectTrigger id="cl-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INPUT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-order">Ordem</Label>
              <Input id="cl-order" name="display_order" type="number" min="0" defaultValue={editing?.display_order ?? items.length} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={required} onCheckedChange={(v) => setRequired(!!v)} />
              Campo obrigatório
            </label>
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
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
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
