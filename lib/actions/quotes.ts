"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionState } from "./auth"

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("id, company_id, role").eq("user_id", user.id).single()
  if (!profile) return null
  return { supabase, user, profile }
}

const lineItemSchema = z.object({
  item_type: z.enum(["scooter", "part", "service", "labor"]),
  product_id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

const createQuoteSchema = z.object({
  customer_id: z.string().min(1, "Cliente é obrigatório"),
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  items: z.string().default("[]"),
  discount: z.coerce.number().nonnegative().default(0),
})

export async function createQuoteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = createQuoteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  let lineItems: z.infer<typeof lineItemSchema>[] = []
  try {
    const raw = JSON.parse(parsed.data.items)
    lineItems = z.array(lineItemSchema).parse(raw)
  } catch {
    return { error: "Itens inválidos" }
  }

  if (lineItems.length === 0) return { error: "Adicione ao menos um item ao orçamento" }

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const discount = Math.min(parsed.data.discount, subtotal)
  const total = Math.max(0, subtotal - discount)

  const { count } = await ctx.supabase
    .from("quotes").select("*", { count: "exact", head: true })
    .eq("company_id", ctx.profile.company_id)

  const quoteNumber = `ORC-${String((count ?? 0) + 1).padStart(5, "0")}`

  const { data: quote, error } = await ctx.supabase
    .from("quotes")
    .insert({
      company_id: ctx.profile.company_id,
      quote_number: quoteNumber,
      customer_id: parsed.data.customer_id,
      vehicle_brand: parsed.data.vehicle_brand?.trim() || null,
      vehicle_model: parsed.data.vehicle_model?.trim() || null,
      service_order_id: null,
      status: "pendente",
      subtotal,
      discount,
      total,
      approved_at: null,
      rejected_at: null,
      valid_until: parsed.data.valid_until || null,
      notes: parsed.data.notes?.trim() || null,
    } as any)
    .select("id")
    .single()

  if (error) return { error: "Erro ao criar orçamento" }

  const { error: itemsError } = await ctx.supabase.from("quote_items").insert(
    lineItems.map(item => ({
      company_id: ctx.profile.company_id,
      quote_id: quote.id,
      product_id: item.product_id && item.product_id !== "" ? item.product_id : null,
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }))
  )

  if (itemsError) {
    await ctx.supabase.from("quotes").delete().eq("id", quote.id)
    return { error: "Erro ao salvar itens do orçamento" }
  }

  revalidatePath("/oficina/orcamentos")
  return { success: "Orçamento criado", id: quote.id }
}

const itemSchema = z.object({
  quote_id: z.string(),
  item_type: z.enum(["scooter", "part", "service", "labor"]).default("part"),
  description: z.string().min(1, "Descrição é obrigatória"),
  product_id: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unit_price: z.coerce.number().nonnegative(),
})

export async function addQuoteItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = itemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { quote_id, product_id, ...rest } = parsed.data
  const resolvedProductId = product_id && product_id !== "" && product_id !== "none" ? product_id : null
  const total = rest.quantity * rest.unit_price

  const { error } = await ctx.supabase.from("quote_items").insert({
    company_id: ctx.profile.company_id,
    quote_id,
    product_id: resolvedProductId,
    ...rest,
    total,
  })

  if (error) return { error: "Erro ao adicionar item" }

  const { data: quoteItems } = await ctx.supabase
    .from("quote_items").select("total").eq("quote_id", quote_id)
  const subtotal = (quoteItems ?? []).reduce((s, i) => s + i.total, 0)
  await ctx.supabase.from("quotes").update({ subtotal, total: subtotal }).eq("id", quote_id)

  revalidatePath(`/oficina/orcamentos/${quote_id}`)
  return { success: "Item adicionado" }
}

export async function deleteQuoteItemAction(
  itemId: string,
  quoteId: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("quote_items").delete()
    .eq("id", itemId).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao remover item" }

  const { data: quoteItems } = await ctx.supabase
    .from("quote_items").select("total").eq("quote_id", quoteId)
  const subtotal = (quoteItems ?? []).reduce((s, i) => s + i.total, 0)
  await ctx.supabase.from("quotes").update({ subtotal, total: subtotal }).eq("id", quoteId)

  revalidatePath(`/oficina/orcamentos/${quoteId}`)
  return { success: "Item removido" }
}

export async function approveQuoteAction(quoteId: string): Promise<ActionState & { osId?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { data: quote } = await ctx.supabase
    .from("quotes")
    .select("id, customer_id, vehicle_brand, vehicle_model, service_order_id, quote_number")
    .eq("id", quoteId)
    .eq("company_id", ctx.profile.company_id)
    .single()

  if (!quote) return { error: "Orçamento não encontrado" }

  const now = new Date().toISOString()

  const { error } = await ctx.supabase
    .from("quotes")
    .update({ status: "aprovado", approved_at: now })
    .eq("id", quoteId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao aprovar orçamento" }

  // Orçamento já vinculado a uma OS existente — só leva o usuário até ela
  if (quote.service_order_id) {
    revalidatePath(`/oficina/orcamentos/${quoteId}`)
    return { success: "Orçamento aprovado", osId: quote.service_order_id }
  }

  // Cria a OS automaticamente a partir do orçamento aprovado
  const { data: quoteItems } = await ctx.supabase
    .from("quote_items")
    .select("item_type, description, product_id, quantity, unit_price, total")
    .eq("quote_id", quoteId)

  const items = quoteItems ?? []
  const laborTotal = items.filter((i) => i.item_type === "labor").reduce((s, i) => s + i.total, 0)
  const partsTotal = items.filter((i) => i.item_type !== "labor").reduce((s, i) => s + i.total, 0)

  const [{ data: defaultStatus }, { count }] = await Promise.all([
    ctx.supabase
      .from("service_order_statuses")
      .select("id")
      .eq("company_id", ctx.profile.company_id)
      .eq("is_default", true)
      .maybeSingle(),
    ctx.supabase
      .from("service_orders").select("*", { count: "exact", head: true })
      .eq("company_id", ctx.profile.company_id),
  ])

  const orderNumber = `OS-${String((count ?? 0) + 1).padStart(5, "0")}`

  const { data: os, error: osError } = await ctx.supabase
    .from("service_orders")
    .insert({
      company_id: ctx.profile.company_id,
      order_number: orderNumber,
      customer_id: quote.customer_id,
      created_by: ctx.user.id,
      status_id: defaultStatus?.id ?? null,
      priority: "normal",
      reported_problem: `Gerada a partir do orçamento ${quote.quote_number}`,
      vehicle_brand: quote.vehicle_brand ?? null,
      vehicle_model: quote.vehicle_model ?? null,
      labor_total: laborTotal,
      parts_total: partsTotal,
      total: laborTotal + partsTotal,
    } as any)
    .select("id")
    .single()

  if (osError || !os) {
    revalidatePath(`/oficina/orcamentos/${quoteId}`)
    return { success: "Orçamento aprovado, mas houve um erro ao gerar a OS automaticamente" }
  }

  if (items.length > 0) {
    await ctx.supabase.from("service_order_items").insert(
      items.map((item) => ({
        company_id: ctx.profile.company_id,
        service_order_id: os.id,
        product_id: item.product_id ?? null,
        item_type: item.item_type === "scooter" ? "part" : item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: 0,
        total: item.total,
      }))
    )
  }

  await ctx.supabase.from("quotes").update({ service_order_id: os.id }).eq("id", quoteId)

  revalidatePath(`/oficina/orcamentos/${quoteId}`)
  revalidatePath("/oficina")
  return { success: "Orçamento aprovado e OS criada", osId: os.id }
}

export async function rejectQuoteAction(quoteId: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const now = new Date().toISOString()
  const { error } = await ctx.supabase
    .from("quotes")
    .update({ status: "rejeitado", rejected_at: now })
    .eq("id", quoteId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao rejeitar orçamento" }

  revalidatePath(`/oficina/orcamentos/${quoteId}`)
  return { success: "Orçamento rejeitado" }
}

// ─── export ───────────────────────────────────────────────────────────────────

export interface OrcamentoExportData {
  quote: {
    quote_number: string
    status: string
    subtotal: number
    discount: number
    total: number
    notes: string | null
    valid_until: string | null
    created_at: string
    approved_at: string | null
    rejected_at: string | null
  }
  customer: { name: string; phone: string | null; whatsapp: string | null; email: string | null; cpf_cnpj: string | null } | null
  os: { order_number: string } | null
  items: { description: string; item_type: string; quantity: number; unit_price: number; total: number }[]
  companyName: string
}

export async function exportOrcamentoAction(quoteId: string): Promise<OrcamentoExportData | null> {
  const ctx = await getCtx()
  if (!ctx) return null
  const cid = ctx.profile.company_id

  const [
    { data: quote },
    { data: items },
    { data: settings },
  ] = await Promise.all([
    ctx.supabase.from("quotes")
      .select("*, customers(name, phone, whatsapp, email, cpf_cnpj), service_orders(order_number)")
      .eq("id", quoteId).eq("company_id", cid).single(),
    ctx.supabase.from("quote_items")
      .select("description, item_type, quantity, unit_price, total")
      .eq("quote_id", quoteId).eq("company_id", cid).order("created_at"),
    ctx.supabase.from("company_settings")
      .select("business_name").eq("company_id", cid).maybeSingle(),
  ])

  if (!quote) return null
  const q = quote as any

  return {
    quote: {
      quote_number: q.quote_number,
      status: q.status,
      subtotal: q.subtotal ?? 0,
      discount: q.discount ?? 0,
      total: q.total ?? 0,
      notes: q.notes ?? null,
      valid_until: q.valid_until ?? null,
      created_at: q.created_at,
      approved_at: q.approved_at ?? null,
      rejected_at: q.rejected_at ?? null,
    },
    customer: q.customers ?? null,
    os: q.service_orders ?? null,
    items: (items ?? []) as OrcamentoExportData["items"],
    companyName: (settings as any)?.business_name ?? "ScooterGestor",
  }
}
