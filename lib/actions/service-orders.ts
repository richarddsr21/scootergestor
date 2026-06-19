"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionState } from "./auth"
import { insertCashMovementsForPayment } from "./cash"

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("id, company_id, role").eq("user_id", user.id).single()
  if (!profile) return null
  return { supabase, user, profile }
}

const createOsSchema = z.object({
  customer_id: z.string().min(1, "Cliente é obrigatório"),
  vehicle_id: z.string().optional(),
  technician_id: z.string().optional(),
  priority: z.enum(["baixa", "normal", "alta", "urgente"]).default("normal"),
  reported_problem: z.string().min(3, "Descreva o problema"),
  expected_delivery_at: z.string().optional(),
  internal_notes: z.string().optional(),
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_chassis: z.string().optional(),
  mileage_km: z.coerce.number().int().nonnegative().optional(),
})

export async function createServiceOrderAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = createOsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Get default status
  const { data: defaultStatus } = await ctx.supabase
    .from("service_order_statuses")
    .select("id")
    .eq("company_id", ctx.profile.company_id)
    .eq("is_default", true)
    .maybeSingle()

  // Generate order number
  const { count } = await ctx.supabase
    .from("service_orders").select("*", { count: "exact", head: true })
    .eq("company_id", ctx.profile.company_id)

  const orderNumber = `OS-${String((count ?? 0) + 1).padStart(5, "0")}`

  const { customer_id, vehicle_id, technician_id, expected_delivery_at, internal_notes, vehicle_brand, vehicle_model, vehicle_chassis, mileage_km, ...rest } = parsed.data

  const { data: os, error } = await ctx.supabase
    .from("service_orders")
    .insert({
      company_id: ctx.profile.company_id,
      order_number: orderNumber,
      customer_id,
      vehicle_id: vehicle_id && vehicle_id !== "" && vehicle_id !== "none" ? vehicle_id : null,
      technician_id: technician_id && technician_id !== "" && technician_id !== "none" ? technician_id : null,
      created_by: ctx.user.id,
      status_id: defaultStatus?.id ?? null,
      ...rest,
      expected_delivery_at: expected_delivery_at && expected_delivery_at !== "" ? expected_delivery_at : null,
      internal_notes: internal_notes?.trim() || null,
      vehicle_brand: vehicle_brand?.trim() || null,
      vehicle_model: vehicle_model?.trim() || null,
      vehicle_chassis: vehicle_chassis?.trim() || null,
      mileage_km: mileage_km ?? null,
    })
    .select("id")
    .single()

  if (error) return { error: "Erro ao criar OS" }

  // Create checklist from default template
  const { data: template } = await ctx.supabase
    .from("checklist_templates")
    .select("id")
    .eq("company_id", ctx.profile.company_id)
    .eq("is_default", true)
    .maybeSingle()

  if (template) {
    const { data: templateItems } = await ctx.supabase
      .from("checklist_template_items")
      .select("*")
      .eq("template_id", template.id)
      .eq("status", "active")
      .order("display_order")

    if (templateItems && templateItems.length > 0) {
      await ctx.supabase.from("service_order_checklists").insert(
        templateItems.map((item) => ({
          company_id: ctx.profile.company_id,
          service_order_id: os.id,
          template_item_id: item.id,
          item_key: item.id,
          label: item.label,
          value: null,
          notes: null,
        }))
      )
    }
  }

  revalidatePath("/oficina")
  return { success: "OS criada com sucesso", id: os.id }
}

export async function updateServiceOrderStatusAction(
  osId: string,
  statusId: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { data: status, error: statusErr } = await ctx.supabase
    .from("service_order_statuses")
    .select("is_final, slug")
    .eq("id", statusId)
    .eq("company_id", ctx.profile.company_id)
    .maybeSingle()

  if (statusErr) return { error: "Erro ao buscar status" }

  const now = new Date().toISOString()
  const isCompleted = status?.slug === "concluida" || status?.slug === "entregue"
  const isDelivered = status?.slug === "entregue"

  const { error } = await ctx.supabase
    .from("service_orders")
    .update({
      status_id: statusId,
      completed_at: isCompleted ? now : undefined,
      delivered_at: isDelivered ? now : undefined,
    })
    .eq("id", osId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao atualizar status" }

  revalidatePath(`/oficina/${osId}`)
  revalidatePath("/oficina")
  revalidatePath("/oficina/orcamentos")
  return { success: "Status atualizado" }
}

const itemSchema = z.object({
  id: z.string().optional(),
  service_order_id: z.string(),
  item_type: z.enum(["part", "service", "labor"]).default("part"),
  description: z.string().min(1, "Descrição é obrigatória"),
  product_id: z.string().optional(),
  quantity: z.coerce.number().positive("Quantidade deve ser positiva").default(1),
  unit_price: z.coerce.number().nonnegative().default(0),
  cost_price: z.coerce.number().nonnegative().default(0),
})

async function recalcQuoteTotals(ctx: Awaited<ReturnType<typeof getCtx>>, quoteId: string) {
  if (!ctx) return
  const { data: items } = await ctx.supabase
    .from("quote_items").select("total").eq("quote_id", quoteId)
  const subtotal = (items ?? []).reduce((s, i) => s + i.total, 0)
  await ctx.supabase.from("quotes").update({ subtotal, total: subtotal }).eq("id", quoteId)
}

export async function saveOsItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = itemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, product_id, service_order_id, ...rest } = parsed.data
  const total = rest.quantity * rest.unit_price
  const resolvedProductId = product_id && product_id !== "" ? product_id : null
  const data = {
    company_id: ctx.profile.company_id,
    service_order_id,
    product_id: resolvedProductId,
    ...rest,
    total,
  }

  // Busca orçamento vinculado à OS (para sync)
  const { data: linkedQuote } = await ctx.supabase
    .from("quotes")
    .select("id")
    .eq("service_order_id", service_order_id)
    .eq("company_id", ctx.profile.company_id)
    .maybeSingle()

  if (id) {
    // Busca descrição antiga para localizar o item correspondente no orçamento
    const { data: oldItem } = await ctx.supabase
      .from("service_order_items")
      .select("description")
      .eq("id", id)
      .eq("company_id", ctx.profile.company_id)
      .single()

    const { error } = await ctx.supabase
      .from("service_order_items").update({ ...data, total })
      .eq("id", id).eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar item" }

    // Sync para o orçamento vinculado
    if (oldItem && linkedQuote) {
      const { data: qItems } = await ctx.supabase
        .from("quote_items")
        .select("id")
        .eq("quote_id", linkedQuote.id)
        .eq("description", oldItem.description)
        .limit(1)

      if (qItems && qItems.length > 0) {
        await ctx.supabase.from("quote_items")
          .update({ item_type: rest.item_type, description: rest.description, product_id: resolvedProductId, quantity: rest.quantity, unit_price: rest.unit_price, total })
          .eq("id", qItems[0].id)
        await recalcQuoteTotals(ctx, linkedQuote.id)
        revalidatePath(`/oficina/orcamentos/${linkedQuote.id}`)
      }
    }
  } else {
    const { error } = await ctx.supabase.from("service_order_items").insert(data)
    if (error) return { error: "Erro ao adicionar item" }

    // Sync para o orçamento vinculado
    if (linkedQuote) {
      await ctx.supabase.from("quote_items").insert({
        company_id: ctx.profile.company_id,
        quote_id: linkedQuote.id,
        product_id: resolvedProductId,
        item_type: rest.item_type,
        description: rest.description,
        quantity: rest.quantity,
        unit_price: rest.unit_price,
        total,
      })
      await recalcQuoteTotals(ctx, linkedQuote.id)
      revalidatePath(`/oficina/orcamentos/${linkedQuote.id}`)
    }
  }

  // Recalculate OS totals
  const { data: items } = await ctx.supabase
    .from("service_order_items")
    .select("item_type, total")
    .eq("service_order_id", service_order_id)

  if (items) {
    const labor_total = items.filter(i => i.item_type === "labor").reduce((s, i) => s + i.total, 0)
    const parts_total = items.filter(i => i.item_type !== "labor").reduce((s, i) => s + i.total, 0)
    await ctx.supabase
      .from("service_orders")
      .update({ labor_total, parts_total, total: labor_total + parts_total })
      .eq("id", service_order_id)
  }

  revalidatePath(`/oficina/${service_order_id}`)
  return { success: id ? "Item atualizado" : "Item adicionado" }
}

export async function deleteOsItemAction(
  id: string,
  serviceOrderId: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  // Busca descrição do item e orçamento vinculado antes de deletar
  const [{ data: osItem }, { data: linkedQuote }] = await Promise.all([
    ctx.supabase.from("service_order_items").select("description").eq("id", id).eq("company_id", ctx.profile.company_id).single(),
    ctx.supabase.from("quotes").select("id").eq("service_order_id", serviceOrderId).eq("company_id", ctx.profile.company_id).maybeSingle(),
  ])

  const { error } = await ctx.supabase
    .from("service_order_items").delete()
    .eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao remover item" }

  // Sync remoção para o orçamento vinculado
  if (osItem && linkedQuote) {
    const { data: qItems } = await ctx.supabase
      .from("quote_items")
      .select("id")
      .eq("quote_id", linkedQuote.id)
      .eq("description", osItem.description)
      .limit(1)

    if (qItems && qItems.length > 0) {
      await ctx.supabase.from("quote_items").delete().eq("id", qItems[0].id).eq("company_id", ctx.profile.company_id)
    }
    await recalcQuoteTotals(ctx, linkedQuote.id)
    revalidatePath(`/oficina/orcamentos/${linkedQuote.id}`)
  }

  // Recalculate OS totals
  const { data: items } = await ctx.supabase
    .from("service_order_items")
    .select("item_type, total")
    .eq("service_order_id", serviceOrderId)

  if (items) {
    const labor_total = items.filter(i => i.item_type === "labor").reduce((s, i) => s + i.total, 0)
    const parts_total = items.filter(i => i.item_type !== "labor").reduce((s, i) => s + i.total, 0)
    await ctx.supabase
      .from("service_orders")
      .update({ labor_total, parts_total, total: labor_total + parts_total })
      .eq("id", serviceOrderId)
  }

  revalidatePath(`/oficina/${serviceOrderId}`)
  return { success: "Item removido" }
}

export async function saveChecklistAnswerAction(
  checklistItemId: string,
  value: string,
  osId: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("service_order_checklists")
    .update({ value })
    .eq("id", checklistItemId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao salvar" }

  revalidatePath(`/oficina/${osId}`)
  return { success: "Salvo" }
}

export async function updateOsNotesAction(
  osId: string,
  field: "technical_diagnosis" | "internal_notes" | "customer_notes",
  value: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const payload =
    field === "technical_diagnosis" ? { technical_diagnosis: value.trim() || null }
    : field === "internal_notes" ? { internal_notes: value.trim() || null }
    : { customer_notes: value.trim() || null }

  const { error } = await ctx.supabase
    .from("service_orders")
    .update(payload)
    .eq("id", osId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao salvar nota" }

  revalidatePath(`/oficina/${osId}`)
  return { success: "Nota salva" }
}

export async function updateOsVehicleInfoAction(
  osId: string,
  data: {
    vehicle_brand: string
    vehicle_model: string
    vehicle_chassis: string
    mileage_km: string
  }
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const mileage = data.mileage_km !== "" ? parseInt(data.mileage_km, 10) : null

  const { error } = await ctx.supabase
    .from("service_orders")
    .update({
      vehicle_brand: data.vehicle_brand.trim() || null,
      vehicle_model: data.vehicle_model.trim() || null,
      vehicle_chassis: data.vehicle_chassis.trim() || null,
      mileage_km: mileage !== null && !isNaN(mileage) ? mileage : null,
    })
    .eq("id", osId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao salvar dados do veículo" }

  revalidatePath(`/oficina/${osId}`)
  return { success: "Dados do veículo salvos" }
}

// ─── payment ──────────────────────────────────────────────────────────────────

export interface OsPaymentEntry {
  method: string
  amount: number
  fee_amount: number
  installments: number
}

export interface OsPaymentData {
  total: number
  payment_status: string
  orderNumber: string
  createdAt: string
  customerName: string
  customerWhatsapp: string | null
  items: { name: string; quantity: number; unitPrice: number; total: number }[]
  subtotal: number
  discount: number
  storeName: string
  storeCnpj: string | null
  storePhone: string | null
  paymentMethods: {
    id: string
    name: string
    type: string
    fee_percent: number
    installment_fees: { installments: number; fee: number }[] | null
  }[]
}

export async function getOsPaymentDataAction(osId: string): Promise<OsPaymentData | null> {
  const ctx = await getCtx()
  if (!ctx) return null

  const [{ data: os }, { data: pms }, { data: settings }] = await Promise.all([
    ctx.supabase
      .from("service_orders")
      .select(`
        total, payment_status, order_number, created_at, discount, labor_total, parts_total,
        customers(name, whatsapp, phone),
        service_order_items(description, quantity, unit_price, total)
      `)
      .eq("id", osId)
      .eq("company_id", ctx.profile.company_id)
      .single(),
    ctx.supabase
      .from("payment_methods")
      .select("id, name, type, fee_percent, installment_fees")
      .eq("company_id", ctx.profile.company_id)
      .eq("active", true)
      .order("name"),
    ctx.supabase
      .from("company_settings")
      .select("business_name, cnpj, whatsapp, phone")
      .eq("company_id", ctx.profile.company_id)
      .maybeSingle(),
  ])

  if (!os) return null

  const customer = (os as any).customers
  const osItems = (os as any).service_order_items ?? []

  return {
    total: os.total,
    payment_status: os.payment_status,
    orderNumber: (os as any).order_number,
    createdAt: (os as any).created_at,
    customerName: customer?.name ?? "Cliente",
    customerWhatsapp: customer?.whatsapp ?? customer?.phone ?? null,
    items: osItems.map((item: any) => ({
      name: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total,
    })),
    subtotal: ((os as any).labor_total ?? 0) + ((os as any).parts_total ?? 0),
    discount: (os as any).discount ?? 0,
    storeName: (settings as any)?.business_name ?? "",
    storeCnpj: (settings as any)?.cnpj ?? null,
    storePhone: (settings as any)?.whatsapp ?? (settings as any)?.phone ?? null,
    paymentMethods: (pms ?? []) as OsPaymentData["paymentMethods"],
  }
}

export async function payServiceOrderAction(
  osId: string,
  entries: OsPaymentEntry[]
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }
  if (!entries.length) return { error: "Selecione a forma de pagamento" }

  const { data: os } = await ctx.supabase
    .from("service_orders")
    .select("total, payment_status")
    .eq("id", osId)
    .eq("company_id", ctx.profile.company_id)
    .single()

  if (!os) return { error: "OS não encontrada" }
  if (os.payment_status === "pago") return { error: "OS já está paga" }

  const now = new Date().toISOString()
  const totalPaid = entries.reduce((s, e) => s + e.amount, 0)

  const { error } = await ctx.supabase.from("payments").insert(
    entries.map((e) => ({
      company_id: ctx.profile.company_id,
      sale_id: null,
      service_order_id: osId,
      method: e.method,
      amount: e.amount,
      fee_amount: e.fee_amount,
      installments: e.installments,
      paid_at: now,
    }))
  )

  if (error) return { error: "Erro ao registrar pagamento" }

  // Registra no caixa aberto (se houver) — falha silenciosa para não bloquear OS
  const { data: osInfo } = await ctx.supabase
    .from("service_orders").select("order_number").eq("id", osId).single()
  if (osInfo) {
    await insertCashMovementsForPayment(
      ctx.supabase,
      ctx.profile.company_id,
      ctx.profile.id,
      "service_order",
      osId,
      `OS ${osInfo.order_number}`,
      entries.map((e) => ({ method: e.method, amount: e.amount }))
    ).catch(() => {})
  }

  const payment_status = totalPaid >= os.total ? "pago" : "parcial"

  const updates: { payment_status: string; status_id?: string; completed_at?: string; delivered_at?: string } = { payment_status }

  if (payment_status === "pago") {
    const { data: entregueStatus } = await ctx.supabase
      .from("service_order_statuses")
      .select("id")
      .eq("company_id", ctx.profile.company_id)
      .eq("slug", "entregue")
      .maybeSingle()

    if (entregueStatus) {
      updates.status_id = entregueStatus.id
      updates.completed_at = now
      updates.delivered_at = now
    }
  }

  await ctx.supabase
    .from("service_orders")
    .update(updates)
    .eq("id", osId)
    .eq("company_id", ctx.profile.company_id)

  return { success: payment_status === "pago" ? "Pagamento registrado" : "Pagamento parcial registrado" }
}

// ─── export ───────────────────────────────────────────────────────────────────

export interface OsExportData {
  os: {
    order_number: string
    priority: string
    reported_problem: string
    technical_diagnosis: string | null
    internal_notes: string | null
    customer_notes: string | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_chassis: string | null
    mileage_km: number | null
    created_at: string
    expected_delivery_at: string | null
    completed_at: string | null
    delivered_at: string | null
    labor_total: number
    parts_total: number
    discount: number
    total: number
    payment_status: string
  }
  customer: { name: string; phone: string | null; whatsapp: string | null; email: string | null; cpf_cnpj: string | null } | null
  technician: { name: string } | null
  status: { name: string; color: string } | null
  items: { description: string; item_type: string; quantity: number; unit_price: number; total: number }[]
  checklist: { label: string; value: string | null; notes: string | null }[]
  payments: { method: string; amount: number; installments: number; paid_at: string | null }[]
  companyName: string
}

export async function exportOsAction(osId: string): Promise<OsExportData | null> {
  const ctx = await getCtx()
  if (!ctx) return null
  const cid = ctx.profile.company_id

  const [
    { data: os },
    { data: items },
    { data: checklist },
    { data: payments },
    { data: settings },
  ] = await Promise.all([
    ctx.supabase.from("service_orders")
      .select("*, customers(name, phone, whatsapp, email, cpf_cnpj), service_order_statuses(name, color), profiles(name)")
      .eq("id", osId).eq("company_id", cid).single(),
    ctx.supabase.from("service_order_items")
      .select("description, item_type, quantity, unit_price, total")
      .eq("service_order_id", osId).eq("company_id", cid).order("created_at"),
    ctx.supabase.from("service_order_checklists")
      .select("label, value, notes")
      .eq("service_order_id", osId).eq("company_id", cid).order("created_at"),
    ctx.supabase.from("payments")
      .select("method, amount, installments, paid_at")
      .eq("service_order_id", osId).eq("company_id", cid),
    ctx.supabase.from("company_settings")
      .select("business_name").eq("company_id", cid).maybeSingle(),
  ])

  if (!os) return null
  const o = os as any

  return {
    os: {
      order_number: o.order_number,
      priority: o.priority,
      reported_problem: o.reported_problem,
      technical_diagnosis: o.technical_diagnosis ?? null,
      internal_notes: o.internal_notes ?? null,
      customer_notes: o.customer_notes ?? null,
      vehicle_brand: o.vehicle_brand ?? null,
      vehicle_model: o.vehicle_model ?? null,
      vehicle_chassis: o.vehicle_chassis ?? null,
      mileage_km: o.mileage_km ?? null,
      created_at: o.created_at,
      expected_delivery_at: o.expected_delivery_at ?? null,
      completed_at: o.completed_at ?? null,
      delivered_at: o.delivered_at ?? null,
      labor_total: o.labor_total ?? 0,
      parts_total: o.parts_total ?? 0,
      discount: o.discount ?? 0,
      total: o.total ?? 0,
      payment_status: o.payment_status,
    },
    customer: o.customers ?? null,
    technician: o.profiles ?? null,
    status: o.service_order_statuses ?? null,
    items: (items ?? []) as OsExportData["items"],
    checklist: (checklist ?? []) as OsExportData["checklist"],
    payments: (payments ?? []) as OsExportData["payments"],
    companyName: (settings as any)?.business_name ?? "ScooterGestor",
  }
}
