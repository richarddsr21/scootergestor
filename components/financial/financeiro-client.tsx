"use client"

import { useState, useActionState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { createTransactionAction, deleteTransactionAction } from "@/lib/actions/financial"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  category_id: string | null
  payment_method: string | null
  transaction_date: string
}
interface Category { id: string; name: string; type: string }

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR")
}

const INIT = { error: undefined, success: undefined }

function TransactionForm({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(createTransactionAction, INIT)
  const formKey = useRef(0)
  const [type, setType] = useState("entrada")

  useEffect(() => {
    if (state.success) { toast.success(state.success); onClose() }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  const filteredCats = categories.filter(c => c.type === type || c.type === "ambos")
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form key={formKey.current} action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo *</Label>
          <Select name="type" value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-date">Data *</Label>
          <Input id="t-date" name="transaction_date" type="date" required defaultValue={today} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="t-desc">Descrição *</Label>
          <Input id="t-desc" name="description" required placeholder="Ex: Pagamento de fornecedor..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-amount">Valor (R$) *</Label>
          <Input id="t-amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0,00" />
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select name="category_id" defaultValue="none">
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {filteredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Select name="payment_method" defaultValue="none">
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informada</SelectItem>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Registrar lançamento"}</Button>
      </div>
    </form>
  )
}

export function FinanceiroClient({
  transactions,
  categories,
  count,
  pageSize,
  currentMes,
  tipo,
}: {
  transactions: Transaction[]
  categories: Category[]
  count: number
  pageSize: number
  currentMes: string
  tipo: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete("page")
    return `${pathname}?${params.toString()}`
  }

  // Build month options (last 12 months)
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    months.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por descrição..." />
        </div>
        <Select value={currentMes} onValueChange={v => router.push(buildUrl({ mes: v }))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {([["", "Todos"], ["entrada", "Entradas"], ["saida", "Saídas"]] as const).map(([t, l]) => (
            <Button key={t} size="sm" variant={tipo === t ? "default" : "outline"} asChild>
              <Link href={buildUrl({ tipo: t })}>{l}</Link>
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />Lançamento
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Nenhum lançamento encontrado.</div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Descrição</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Categoria</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Data</th>
                  <th className="text-right p-3 font-medium">Valor</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-1 ${t.type === "entrada" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"}`}>
                          {t.type === "entrada" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-medium">{t.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">
                      {categories.find(c => c.id === t.category_id)?.name ?? "—"}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{fmtDate(t.transaction_date)}</td>
                    <td className={`p-3 text-right font-semibold ${t.type === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                      {t.type === "entrada" ? "+" : "−"}{fmt(t.amount)}
                    </td>
                    <td className="p-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => {
                              const r = await deleteTransactionAction(t.id)
                              if (r.error) toast.error(r.error)
                              else toast.success(r.success ?? "Excluído")
                            }}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={count} pageSize={pageSize} />
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
          <TransactionForm categories={categories} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
