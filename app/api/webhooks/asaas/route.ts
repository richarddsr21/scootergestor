import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAsaasSubscription } from "@/lib/asaas"
import type { Database } from "@/types/database"

type AsaasWebhookPayload = {
  event: string
  payment?: {
    subscription?: string
    externalReference?: string
  }
}

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token")
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 })
  }

  let payload: AsaasWebhookPayload
  try {
    payload = (await req.json()) as AsaasWebhookPayload
  } catch {
    // Malformed JSON body — treat as an event we can't process, still 200.
    return NextResponse.json({ ok: true })
  }

  const { event, payment } = payload

  if (!payment) {
    // Event type without a `payment` object (e.g. not payment-related) — ignore.
    return NextResponse.json({ ok: true })
  }

  const supabase = createAdminClient()

  let company: { id: string; payment_overdue_since: string | null } | null = null

  if (payment.subscription) {
    const { data } = await supabase
      .from("companies")
      .select("id, payment_overdue_since")
      .eq("asaas_subscription_id", payment.subscription)
      .maybeSingle()
    company = data
  }

  if (!company && payment.externalReference) {
    const { data } = await supabase
      .from("companies")
      .select("id, payment_overdue_since")
      .eq("id", payment.externalReference)
      .maybeSingle()
    company = data
  }

  if (!company) {
    console.error(
      `Asaas webhook: company not found (subscription=${payment.subscription ?? "?"}, externalReference=${payment.externalReference ?? "?"})`
    )
    return NextResponse.json({ ok: true })
  }

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    // `nextDueDate` belongs to the Asaas *subscription* object, not the
    // *payment* object the webhook sends us (payments carry
    // dueDate/originalDueDate/paymentDate instead) — reading it straight off
    // `payment` would silently leave subscription_current_period_end null
    // forever. Reconcile via a live subscription fetch instead. If that
    // fetch fails, fall back to leaving the column unchanged rather than
    // blocking the rest of the update — the company should still get
    // unblocked even if this one field can't be resolved right now.
    let nextDueDate: string | null | undefined
    if (payment.subscription) {
      try {
        const subscription = (await getAsaasSubscription(payment.subscription)) as {
          nextDueDate?: string
        }
        nextDueDate = subscription?.nextDueDate ?? null
      } catch (e) {
        console.error(
          `Asaas webhook: failed to fetch subscription ${payment.subscription} for nextDueDate`,
          e
        )
      }
    }

    const updates: Database["public"]["Tables"]["companies"]["Update"] = {
      status: "active",
      subscription_status: "ACTIVE",
      payment_overdue_since: null,
    }
    if (nextDueDate !== undefined) {
      updates.subscription_current_period_end = nextDueDate
    }

    const { error } = await supabase.from("companies").update(updates).eq("id", company.id)

    if (error) {
      console.error(
        `Asaas webhook: failed to update company ${company.id} for event ${event}`,
        error
      )
      return NextResponse.json({ error: "db update failed" }, { status: 500 })
    }
  } else if (event === "PAYMENT_OVERDUE") {
    const { error } = await supabase
      .from("companies")
      .update({
        subscription_status: "OVERDUE",
        payment_overdue_since: company.payment_overdue_since ?? new Date().toISOString(),
      })
      .eq("id", company.id)

    if (error) {
      console.error(
        `Asaas webhook: failed to update company ${company.id} for event ${event}`,
        error
      )
      return NextResponse.json({ error: "db update failed" }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
