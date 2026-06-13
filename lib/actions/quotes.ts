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

const createQuoteSchema = z.object({
  service_order_id: z.string().min(1, "OS é obrigatória"),
  customer_id: z.string().min(1),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
})

export async function createQuoteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = createQuoteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

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
      service_order_id: parsed.data.service_order_id,
      status: "pendente",
      subtotal: 0,
      discount: 0,
      total: 0,
      approved_at: null,
      rejected_at: null,
      valid_until: parsed.data.valid_until || null,
      notes: parsed.data.notes?.trim() || null,
    })
    .select("id")
    .single()

  if (error) return { error: "Erro ao criar orçamento" }

  // Copy items from OS (if any) to quote
  const { data: osItems } = await ctx.supabase
    .from("service_order_items")
    .select("item_type, description, product_id, quantity, unit_price, total")
    .eq("service_order_id", parsed.data.service_order_id)
    .eq("company_id", ctx.profile.company_id)

  if (osItems && osItems.length > 0) {
    await ctx.supabase.from("quote_items").insert(
      osItems.map(item => ({
        company_id: ctx.profile.company_id,
        quote_id: quote.id,
        product_id: item.product_id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))
    )
    const subtotal = osItems.reduce((s, i) => s + i.total, 0)
    await ctx.supabase.from("quotes").update({ subtotal, total: subtotal }).eq("id", quote.id)
  }

  // Move OS to "Aguardando Aprovação" status
  const { data: waitStatus } = await ctx.supabase
    .from("service_order_statuses")
    .select("id")
    .eq("company_id", ctx.profile.company_id)
    .eq("slug", "aguardando-aprovacao")
    .maybeSingle()

  if (waitStatus) {
    await ctx.supabase
      .from("service_orders")
      .update({ status_id: waitStatus.id })
      .eq("id", parsed.data.service_order_id)
      .eq("company_id", ctx.profile.company_id)
  }

  revalidatePath("/oficina/orcamentos")
  revalidatePath(`/oficina/${parsed.data.service_order_id}`)
  return { success: "Orçamento criado", id: quote.id }
}

const itemSchema = z.object({
  quote_id: z.string(),
  item_type: z.enum(["part", "service", "labor"]).default("part"),
  description: z.string().min(1, "Descrição é obrigatória"),
  product_id: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unit_price: z.coerce.number().nonnegative(),
})

async function recalcOsTotals(ctx: Awaited<ReturnType<typeof getCtx>>, osId: string) {
  if (!ctx) return
  const { data: osItems } = await ctx.supabase
    .from("service_order_items").select("item_type, total").eq("service_order_id", osId)
  if (!osItems) return
  const labor_total = osItems.filter(i => i.item_type === "labor").reduce((s, i) => s + i.total, 0)
  const parts_total = osItems.filter(i => i.item_type !== "labor").reduce((s, i) => s + i.total, 0)
  await ctx.supabase.from("service_orders")
    .update({ labor_total, parts_total, total: labor_total + parts_total })
    .eq("id", osId).eq("company_id", ctx.profile.company_id)
}

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

  // Fetch quote (for service_order_id) and product cost in parallel
  const [{ data: quote }, { data: product }] = await Promise.all([
    ctx.supabase.from("quotes").select("service_order_id").eq("id", quote_id).eq("company_id", ctx.profile.company_id).single(),
    resolvedProductId
      ? ctx.supabase.from("products").select("cost_price").eq("id", resolvedProductId).single()
      : Promise.resolve({ data: null }),
  ])

  const { error } = await ctx.supabase.from("quote_items").insert({
    company_id: ctx.profile.company_id,
    quote_id,
    product_id: resolvedProductId,
    ...rest,
    total,
  })

  if (error) return { error: "Erro ao adicionar item" }

  // Sync to linked OS
  if (quote?.service_order_id) {
    await ctx.supabase.from("service_order_items").insert({
      company_id: ctx.profile.company_id,
      service_order_id: quote.service_order_id,
      product_id: resolvedProductId,
      item_type: rest.item_type,
      description: rest.description,
      quantity: rest.quantity,
      unit_price: rest.unit_price,
      cost_price: (product as any)?.cost_price ?? 0,
      total,
    })
    await recalcOsTotals(ctx, quote.service_order_id)
    revalidatePath(`/oficina/${quote.service_order_id}`)
  }

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

  // Fetch item details + quote's service_order_id before deleting
  const [{ data: item }, { data: quote }] = await Promise.all([
    ctx.supabase.from("quote_items").select("description, item_type, product_id").eq("id", itemId).eq("company_id", ctx.profile.company_id).single(),
    ctx.supabase.from("quotes").select("service_order_id").eq("id", quoteId).eq("company_id", ctx.profile.company_id).single(),
  ])

  const { error } = await ctx.supabase
    .from("quote_items").delete()
    .eq("id", itemId).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao remover item" }

  // Sync removal to linked OS — match by description in the same OS
  if (item && quote?.service_order_id) {
    const { data: osItems } = await ctx.supabase
      .from("service_order_items")
      .select("id")
      .eq("service_order_id", quote.service_order_id)
      .eq("company_id", ctx.profile.company_id)
      .eq("description", item.description)
      .limit(1)

    if (osItems && osItems.length > 0) {
      await ctx.supabase.from("service_order_items").delete().eq("id", osItems[0].id).eq("company_id", ctx.profile.company_id)
    }
    await recalcOsTotals(ctx, quote.service_order_id)
    revalidatePath(`/oficina/${quote.service_order_id}`)
  }

  const { data: quoteItems } = await ctx.supabase
    .from("quote_items").select("total").eq("quote_id", quoteId)
  const subtotal = (quoteItems ?? []).reduce((s, i) => s + i.total, 0)
  await ctx.supabase.from("quotes").update({ subtotal, total: subtotal }).eq("id", quoteId)

  revalidatePath(`/oficina/orcamentos/${quoteId}`)
  return { success: "Item removido" }
}

export async function approveQuoteAction(
  quoteId: string,
  osId: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const now = new Date().toISOString()

  const { error: qErr } = await ctx.supabase
    .from("quotes")
    .update({ status: "aprovado", approved_at: now })
    .eq("id", quoteId)
    .eq("company_id", ctx.profile.company_id)

  if (qErr) return { error: "Erro ao aprovar orçamento" }

  const { data: aprovadaStatus } = await ctx.supabase
    .from("service_order_statuses")
    .select("id")
    .eq("company_id", ctx.profile.company_id)
    .eq("slug", "aprovada")
    .maybeSingle()

  if (aprovadaStatus) {
    await ctx.supabase
      .from("service_orders")
      .update({ status_id: aprovadaStatus.id })
      .eq("id", osId)
      .eq("company_id", ctx.profile.company_id)
  }

  revalidatePath(`/oficina/orcamentos/${quoteId}`)
  revalidatePath(`/oficina/${osId}`)
  return { success: "Orçamento aprovado — OS atualizada" }
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
