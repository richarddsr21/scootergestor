import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPlanConfig } from "@/lib/plans"
import type { Plan } from "@/lib/constants"
import { StartSubscriptionButton } from "@/components/billing/start-subscription-button"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export default async function AssinaturaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const supabase = await createClient()
  const { data: company } = await supabase
    .from("companies").select("*").eq("id", profile.company_id).single()
  if (!company) redirect("/onboarding")

  const plan = company.plan as Plan
  const config = getPlanConfig(plan)

  const isBlocked =
    company.status === "suspended" ||
    (company.status === "trial" && company.trial_ends_at !== null && new Date(company.trial_ends_at) < new Date()) ||
    (company.payment_overdue_since !== null &&
      Date.now() - new Date(company.payment_overdue_since).getTime() > 3 * 24 * 60 * 60 * 1000)

  if (!isBlocked && company.status === "active") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Assinatura ativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Plano Pro — {formatCurrency(config.price)}/mês.</p>
          <p className="text-muted-foreground">
            Veja detalhes completos em{" "}
            <a href="/configuracoes/plano" className="font-medium underline underline-offset-2">
              Configurações → Plano
            </a>.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Assine o plano Pro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          {formatCurrency(config.price)}/mês — PIX ou cartão, no checkout seguro do Asaas.
        </p>
        <StartSubscriptionButton />
      </CardContent>
    </Card>
  )
}
