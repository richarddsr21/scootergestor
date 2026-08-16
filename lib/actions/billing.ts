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

  return { profile, company }
}

export async function startSubscriptionAction(
  _prev: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { profile, company } = ctx

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
      if (!company.cnpj) {
        return { error: "Cadastre o CNPJ da empresa em Configurações antes de assinar." }
      }

      const customer = await createAsaasCustomer({
        name: company.name,
        email: profile.email,
        cpfCnpj: company.cnpj ?? undefined,
      })
      customerId = customer.id
      await admin.from("companies").update({ asaas_customer_id: customerId }).eq("id", company.id)
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
    await admin.from("companies").update({ asaas_subscription_id: subscription.id }).eq("id", company.id)

    const checkoutUrl = await getOpenPaymentUrl(subscription.id)
    return { checkoutUrl }
  } catch (e) {
    console.error(e)
    return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
  }
}
