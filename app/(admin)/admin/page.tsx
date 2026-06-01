import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { PLAN_LABELS } from "@/lib/constants"

const PAGE_SIZE = 25

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>
}) {
  const { q, page: pageStr, status } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from("companies")
    .select("id, name, slug, plan, status, created_at, email, subscription_status", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,email.ilike.%${q}%`)
  if (status) query = query.eq("status", status)

  const { data: companies, count } = await query

  const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    trial: "secondary",
    active: "default",
    suspended: "destructive",
    canceled: "outline",
  }
  const STATUS_LABELS: Record<string, string> = {
    trial: "Trial",
    active: "Ativo",
    suspended: "Suspenso",
    canceled: "Cancelado",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas cadastradas</h1>
          <p className="text-muted-foreground text-sm">{count ?? 0} empresas no total</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48 max-w-sm">
          <SearchInput placeholder="Buscar por nome, slug, e-mail..." />
        </div>
        <div className="flex gap-1">
          {([["", "Todas"], ["trial", "Trial"], ["active", "Ativas"], ["suspended", "Suspensas"]] as const).map(([s, l]) => (
            <Button key={s} size="sm" variant={(status ?? "") === s ? "default" : "outline"} asChild>
              <Link href={s ? `/admin?status=${s}` : "/admin"}>{l}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Empresa</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Plano</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Status</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Criada em</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(companies ?? []).map(c => (
              <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <Badge variant="outline">{PLAN_LABELS[c.plan] ?? c.plan}</Badge>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <Badge variant={STATUS_VARIANTS[c.status] ?? "secondary"}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
                </td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{fmtDate(c.created_at)}</td>
                <td className="p-3">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/admin/${c.id}`}>Detalhes</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  )
}
