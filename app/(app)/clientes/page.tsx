import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { Plus, Users, Phone } from "lucide-react"

const PAGE_SIZE = 20

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? "1"))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  let query = supabase
    .from("customers")
    .select("id, name, phone, whatsapp, email, city, cpf_cnpj, created_at", { count: "exact" })
    .eq("company_id", cid)
    .order("name")
    .range(from, to)

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: customers, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" description={`${count ?? 0} cliente${(count ?? 0) !== 1 ? "s" : ""} cadastrado${(count ?? 0) !== 1 ? "s" : ""}`} />
        <Button asChild size="sm">
          <Link href="/clientes/novo"><Plus className="mr-1 h-4 w-4" />Novo cliente</Link>
        </Button>
      </div>

      <div className="max-w-sm">
        <SearchInput placeholder="Buscar por nome, telefone, CPF..." />
      </div>

      {(!customers || customers.length === 0) ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={q ? "Tente ajustar o filtro de busca." : "Cadastre seu primeiro cliente."}
        >
          {!q && (
            <Button asChild size="sm">
              <Link href="/clientes/novo"><Plus className="mr-1 h-4 w-4" />Novo cliente</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <Link key={c.id} href={`/clientes/${c.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
                        {(c.phone || c.whatsapp) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{c.whatsapp ?? c.phone}</span>
                          </div>
                        )}
                        {c.cpf_cnpj && <p className="text-xs text-muted-foreground mt-0.5">{c.cpf_cnpj}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  )
}
