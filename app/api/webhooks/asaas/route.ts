import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type AsaasWebhookPayload = {
  event: string
  payment?: {
    subscription?: string
    externalReference?: string
    nextDueDate?: string
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
    await supabase
      .from("companies")
      .update({
        status: "active",
        subscription_status: "ACTIVE",
        subscription_current_period_end: payment.nextDueDate ?? null,
        payment_overdue_since: null,
      })
      .eq("id", company.id)
  } else if (event === "PAYMENT_OVERDUE") {
    await supabase
      .from("companies")
      .update({
        subscription_status: "OVERDUE",
        payment_overdue_since: company.payment_overdue_since ?? new Date().toISOString(),
      })
      .eq("id", company.id)
  }

  return NextResponse.json({ ok: true })
}
