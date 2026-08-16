// lib/actions/billing.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAsaasCustomer, createAsaasSubscription, getOpenPaymentUrl } from "@/lib/asaas"
import { getPlanConfig } from "@/lib/plans"
import type { Plan } from "@/lib/constants"

export type BillingActionState = { error?: string; checkoutUrl?: string }

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles").select("id, name, email, company_id").eq("user_id", user.id).single()
  if (!profile) return null

  const { data: company } = await supabase
    .from("companies").select("*").eq("id", profile.company_id).single()
  if (!company) return null

  const { data: settings } = await supabase
    .from("company_settings")
    .select("cnpj")
    .eq("company_id", profile.company_id)
    .maybeSingle()

  return { profile, company, cnpj: settings?.cnpj ?? null }
}

export async function startSubscriptionAction(
  _prev: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { profile, company, cnpj } = ctx

  if (company.asaas_subscription_id) {
    try {
      const checkoutUrl = await getOpenPaymentUrl(company.asaas_subscription_id)
      return { checkoutUrl }
    } catch (e) {
      console.error(e)
      return { error: "Não foi possível carregar o link de pagamento. Tente novamente." }
    }
  }

  // Writes to companies.asaas_customer_id / asaas_subscription_id go through
  // the admin (service-role) client: a new DB trigger now blocks these
  // billing columns from being written by the session-scoped client unless
  // the caller is a saas admin, to close the paywall-bypass hole where any
  // company member could otherwise UPDATE their own company's billing
  // fields via the browser's Supabase client. getCtx() already scoped
  // `company` to the authenticated user's own company_id, so there's no
  // cross-tenant risk in using the admin client for this write.
  const admin = createAdminClient()

  try {
    let customerId = company.asaas_customer_id
    if (!customerId) {
      if (!cnpj) {
        // /assinatura is reached by both blocked companies (who can't reach
        // Configurações, since app/(app)/* gates them out) and unblocked
        // trial companies following the banner (who can) — cover both.
        return { error: "Não foi possível iniciar o pagamento: CNPJ da empresa não cadastrado. Cadastre em Configurações → Empresa, ou entre em contato com o suporte se não conseguir acessar." }
      }

      const customer = await createAsaasCustomer({
        name: company.name,
        email: profile.email,
        cpfCnpj: cnpj.replace(/\D/g, ""),
      })
      customerId = customer.id
      const { error: customerUpdateError } = await admin
        .from("companies")
        .update({ asaas_customer_id: customerId })
        .eq("id", company.id)
      if (customerUpdateError) {
        console.error("Failed to persist asaas_customer_id", { companyId: company.id, error: customerUpdateError })
        return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
      }
    }

    const plan = company.plan as Plan
    const config = getPlanConfig(plan)

    const subscription = await createAsaasSubscription({
      customerId,
      externalReference: company.id,
      value: config.price,
    })

    // Persist the subscription id BEFORE fetching the checkout URL. If
    // getOpenPaymentUrl throws below, the id is already saved, so a retry
    // takes the "already has asaas_subscription_id" branch above instead of
    // creating a second (duplicate-billing) subscription in Asaas.
    const { error: subscriptionUpdateError } = await admin
      .from("companies")
      .update({ asaas_subscription_id: subscription.id })
      .eq("id", company.id)
    if (subscriptionUpdateError) {
      console.error("Failed to persist asaas_subscription_id", { companyId: company.id, error: subscriptionUpdateError })
      return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
    }

    const checkoutUrl = await getOpenPaymentUrl(subscription.id)
    return { checkoutUrl }
  } catch (e) {
    console.error(e)
    return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
  }
}
