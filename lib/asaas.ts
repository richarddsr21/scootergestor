// lib/asaas.ts
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3"

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error("ASAAS_API_KEY is required")

  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export async function createAsaasCustomer(params: {
  name: string
  email: string
  cpfCnpj?: string
}): Promise<{ id: string }> {
  return asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export async function getOpenPaymentUrl(subscriptionId: string): Promise<string> {
  // No single Asaas filter reliably returns just the open invoice across all
  // subscription ages, so fetch the list and pick the first payment that is
  // still open (PENDING) or overdue (OVERDUE) rather than assuming data[0]
  // is the open one — for a returning/overdue customer there can be several
  // payments and Asaas's default ordering isn't guaranteed to put the open
  // one first.
  const payments = await asaasFetch<{ data: Array<{ invoiceUrl: string; status: string }> }>(
    `/payments?subscription=${subscriptionId}`
  )
  const openPayment = payments.data.find(
    (p) => p.status === "PENDING" || p.status === "OVERDUE"
  )
  if (!openPayment) throw new Error(`No open payment found for subscription ${subscriptionId}`)
  return openPayment.invoiceUrl
}

export async function createAsaasSubscription(params: {
  customerId: string
  externalReference: string
  value: number
}): Promise<{ id: string }> {
  // Intentionally does NOT fetch the checkout URL here — callers must
  // persist `id` to companies.asaas_subscription_id before calling
  // getOpenPaymentUrl separately. If we fetched the checkout URL as part of
  // this call and that fetch threw, the subscription would already exist in
  // Asaas but its id would never reach our DB, so a retry would create a
  // second (duplicate) subscription.
  const subscription = await asaasFetch<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "UNDEFINED",
      cycle: "MONTHLY",
      value: params.value,
      nextDueDate: new Date().toISOString().slice(0, 10),
      externalReference: params.externalReference,
    }),
  })

  return { id: subscription.id }
}

export async function getAsaasSubscription(id: string): Promise<unknown> {
  return asaasFetch(`/subscriptions/${id}`)
}
