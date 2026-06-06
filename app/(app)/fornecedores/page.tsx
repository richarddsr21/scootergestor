import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { Plus, Truck, Phone, Mail } from "lucide-react"

const PAGE_SIZE = 20

export default async function FornecedoresPage({
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
    .from("suppliers")
    .select("id, name, cnpj, phone, whatsapp, email, address, created_at", { count: "exact" })
    .eq("company_id", cid)
    .order("name")
    .range(from, to)

  if (q) {
    query = query.or(`name.ilike.%${q}%,cnpj.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: suppliers, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Fornecedores"
          description={`${count ?? 0} fornecedor${(count ?? 0) !== 1 ? "es" : ""} cadastrado${(count ?? 0) !== 1 ? "s" : ""}`}
        />
        <Button asChild size="sm">
          <Link href="/fornecedores/novo">
            <Plus className="mr-1 h-4 w-4" />Novo fornecedor
          </Link>
        </Button>
      </div>

      <div className="max-w-sm">
        <SearchInput placeholder="Buscar por nome, CNPJ, e-mail..." />
      </div>

      {(!suppliers || suppliers.length === 0) ? (
        <EmptyState
          icon={Truck}
          title="Nenhum fornecedor encontrado"
          description={q ? "Tente ajustar o filtro de busca." : "Cadastre seu primeiro fornecedor."}
        >
          {!q && (
            <Button asChild size="sm">
              <Link href="/fornecedores/novo">
                <Plus className="mr-1 h-4 w-4" />Novo fornecedor
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <Link key={s.id} href={`/fornecedores/${s.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{s.name}</p>
                        {s.cnpj && <p className="text-xs text-muted-foreground">{s.cnpj}</p>}
                        {(s.phone || s.whatsapp) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{s.whatsapp ?? s.phone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                          </div>
                        )}
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
