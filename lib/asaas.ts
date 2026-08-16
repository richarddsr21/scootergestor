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
  const payments = await asaasFetch<{ data: Array<{ invoiceUrl: string }> }>(
    `/payments?subscription=${subscriptionId}`
  )
  const payment = payments.data[0]
  if (!payment) throw new Error(`No payment found for subscription ${subscriptionId}`)
  return payment.invoiceUrl
}

export async function createAsaasSubscription(params: {
  customerId: string
  externalReference: string
  value: number
}): Promise<{ id: string; checkoutUrl: string }> {
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

  const checkoutUrl = await getOpenPaymentUrl(subscription.id)
  return { id: subscription.id, checkoutUrl }
}

export async function getAsaasSubscription(id: string): Promise<unknown> {
  return asaasFetch(`/subscriptions/${id}`)
}
