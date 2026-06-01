"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { saveOsStatusAction, deleteOsStatusAction } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"

type Status = Tables<"service_order_statuses">

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export function StatusOsClient({ statuses }: { statuses: Status[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Status | null>(null)
  const [isDefault, setIsDefault] = React.useState(false)
  const [isFinal, setIsFinal] = React.useState(false)
  const [slugValue, setSlugValue] = React.useState("")
  const [saveState, formAction, pending] = useActionState(saveOsStatusAction, {})
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
    setIsDefault(false)
    setIsFinal(false)
    setSlugValue("")
    setDialogOpen(true)
  }

  function openEdit(s: Status) {
    setEditing(s)
    setIsDefault(s.is_default)
    setIsFinal(s.is_final)
    setSlugValue(s.slug)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteOsStatusAction(deleteId)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Novo status
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Final</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum status cadastrado.
                </TableCell>
              </TableRow>
            )}
            {statuses.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: s.color }} />
                </TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{s.slug}</TableCell>
                <TableCell>{s.is_default ? "✓" : "—"}</TableCell>
                <TableCell>{s.is_final ? "✓" : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(s.id)}
                    >
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
            <DialogTitle>{editing ? "Editar status" : "Novo status"}</DialogTitle>
          </DialogHeader>
          <form key={formKey.current} action={formAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <input type="hidden" name="is_default" value={isDefault ? "true" : "false"} />
            <input type="hidden" name="is_final" value={isFinal ? "true" : "false"} />
            <div className="space-y-2">
              <Label htmlFor="os-name">Nome *</Label>
              <Input
                id="os-name"
                name="name"
                defaultValue={editing?.name ?? ""}
                required
                onChange={(e) => {
                  if (!editing) setSlugValue(slugify(e.target.value))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="os-slug">Slug</Label>
              <Input
                id="os-slug"
                name="slug"
                value={slugValue}
                onChange={(e) => setSlugValue(slugify(e.target.value))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="os-color">Cor</Label>
              <input
                type="color"
                id="os-color"
                name="color"
                defaultValue={editing?.color ?? "#6366f1"}
                className="h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="os-order">Ordem</Label>
              <Input id="os-order" name="display_order" type="number" min="0" defaultValue={editing?.display_order ?? statuses.length} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={isDefault}
                  onCheckedChange={(v) => setIsDefault(!!v)}
                />
                Padrão (novas OS)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={isFinal}
                  onCheckedChange={(v) => setIsFinal(!!v)}
                />
                Status final
              </label>
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
            <AlertDialogTitle>Excluir status?</AlertDialogTitle>
            <AlertDialogDescription>
              OS com este status perderão o vínculo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
