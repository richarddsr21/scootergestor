import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { PLAN_LABELS, ROLE_LABELS } from "@/lib/constants"

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: members }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase.from("profiles").select("id, name, email, role, status, created_at").eq("company_id", id).order("role"),
  ])

  if (!company) notFound()

  const [
    { count: customerCount },
    { count: productCount },
    { count: osCount },
    { count: saleCount },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("company_id", id),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("company_id", id).eq("status", "active"),
    supabase.from("service_orders").select("*", { count: "exact", head: true }).eq("company_id", id),
    supabase.from("sales").select("*", { count: "exact", head: true }).eq("company_id", id),
  ])

  const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    trial: "secondary", active: "default", suspended: "destructive", canceled: "outline",
  }
  const STATUS_LABELS: Record<string, string> = {
    trial: "Trial", active: "Ativo", suspended: "Suspenso", canceled: "Cancelado",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">{company.slug}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[company.status] ?? "secondary"}>{STATUS_LABELS[company.status] ?? company.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clientes", value: customerCount ?? 0 },
          { label: "Produtos ativos", value: productCount ?? 0 },
          { label: "Ordens de serviço", value: osCount ?? 0 },
          { label: "Vendas realizadas", value: saleCount ?? 0 },
        ].map(s => (
          <Card key={s.label} className="py-4">
            <CardHeader className="pb-0"><CardTitle className="text-xs text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent className="pt-2"><div className="text-2xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informações da empresa</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Plano</span><Badge variant="outline">{PLAN_LABELS[company.plan] ?? company.plan}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status subscr.</span><span>{company.subscription_status ?? "—"}</span></div>
            {company.email && <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span>{company.email}</span></div>}
            {company.cnpj && <div className="flex justify-between"><span className="text-muted-foreground">CNPJ</span><span>{company.cnpj}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Criada em</span><span>{fmtDate(company.created_at)}</span></div>
            {company.trial_ends_at && (
              <div className="flex justify-between"><span className="text-muted-foreground">Trial até</span><span>{fmtDate(company.trial_ends_at)}</span></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Usuários ({members?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(members ?? []).map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                    {m.status !== "active" && <Badge variant="secondary" className="text-xs">{m.status}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
