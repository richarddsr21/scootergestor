// lib/actions/billing.ts
"use server"

import { createClient } from "@/lib/supabase/server"
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

  return { supabase, profile, company }
}

export async function startSubscriptionAction(
  _prev: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { supabase, profile, company } = ctx

  if (company.asaas_subscription_id) {
    try {
      const checkoutUrl = await getOpenPaymentUrl(company.asaas_subscription_id)
      return { checkoutUrl }
    } catch {
      return { error: "Não foi possível carregar o link de pagamento. Tente novamente." }
    }
  }

  try {
    let customerId = company.asaas_customer_id
    if (!customerId) {
      const customer = await createAsaasCustomer({ name: company.name, email: profile.email })
      customerId = customer.id
      await supabase.from("companies").update({ asaas_customer_id: customerId }).eq("id", company.id)
    }

    const plan = company.plan as Plan
    const config = getPlanConfig(plan)

    const subscription = await createAsaasSubscription({
      customerId,
      externalReference: company.id,
      value: config.price,
    })

    await supabase.from("companies").update({ asaas_subscription_id: subscription.id }).eq("id", company.id)

    return { checkoutUrl: subscription.checkoutUrl }
  } catch {
    return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
  }
}
