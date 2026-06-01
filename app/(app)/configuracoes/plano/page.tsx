import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPlanConfig } from "@/lib/plans"
import { PLAN_LABELS } from "@/lib/constants"
import type { Plan } from "@/lib/constants"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export default async function PlanoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("user_id", user.id).single()
  if (!profile) redirect("/onboarding")

  const { data: company } = await supabase
    .from("companies").select("*").eq("id", profile.company_id).single()
  if (!company) redirect("/onboarding")

  const plan = company.plan as Plan
  const config = getPlanConfig(plan)

  const featureItems = [
    { label: "PDV (Ponto de Venda)", key: "pdv" },
    { label: "Módulo financeiro", key: "financialModule" },
    { label: "Checklist personalizado", key: "customChecklist" },
    { label: "Status personalizados", key: "customStatuses" },
    { label: "Templates WhatsApp", key: "whatsappTemplates" },
    { label: "Relatórios avançados", key: "advancedReports" },
    { label: "Exportação PDF", key: "pdfExport" },
    { label: "Fornecedores", key: "suppliers" },
    { label: "Compras", key: "purchases" },
    { label: "Garantia avançada", key: "advancedWarranty" },
    { label: "Permissões avançadas", key: "advancedPermissions" },
    { label: "Múltiplas unidades", key: "multipleUnits" },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano e faturamento"
        description="Informações sobre seu plano atual e limites de uso."
      />

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plano atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{PLAN_LABELS[plan] ?? plan}</span>
              <Badge variant={company.status === "active" ? "default" : "secondary"}>
                {company.status === "trial" ? "Trial" : company.status === "active" ? "Ativo" : company.status}
              </Badge>
            </div>
            {config.price > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(config.price)}/mês
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validade / Renovação</CardTitle>
          </CardHeader>
          <CardContent>
            {company.status === "trial" ? (
              <p className="text-sm">Trial expira em <strong>{formatDate(company.trial_ends_at)}</strong></p>
            ) : (
              <p className="text-sm">Próxima renovação: <strong>{formatDate(company.subscription_current_period_end)}</strong></p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limites do plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuários</span>
              <span>{config.limits.maxUsers === Infinity ? "Ilimitado" : config.limits.maxUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produtos</span>
              <span>{config.limits.maxProducts === Infinity ? "Ilimitado" : config.limits.maxProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clientes</span>
              <span>{config.limits.maxCustomers === Infinity ? "Ilimitado" : config.limits.maxCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">OS/mês</span>
              <span>{config.limits.maxServiceOrdersPerMonth === Infinity ? "Ilimitado" : config.limits.maxServiceOrdersPerMonth}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {featureItems.map(({ label, key }) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span>{config.features[key] ? "✓" : "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground max-w-2xl">
        Para mudar de plano ou gerenciar sua assinatura, entre em contato com o suporte.
      </p>
    </div>
  )
}
