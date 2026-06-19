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
  item_type: z.enum(["part", "service", "labor"]),
  product_id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

const createQuoteSchema = z.object({
  customer_id: z.string().min(1, "Cliente é obrigatório"),
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
      service_order_id: null,
      status: "pendente",
      subtotal,
      discount,
      total,
      approved_at: null,
      rejected_at: null,
      valid_until: parsed.data.valid_until || null,
      notes: parsed.data.notes?.trim() || null,
    })
    .select("id")
    .single()

  if (error) return { error: "Erro ao criar orçamento" }

  await ctx.supabase.from("quote_items").insert(
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

  revalidatePath("/oficina/orcamentos")
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

export async function approveQuoteAction(quoteId: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const now = new Date().toISOString()

  const { error } = await ctx.supabase
    .from("quotes")
    .update({ status: "aprovado", approved_at: now })
    .eq("id", quoteId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao aprovar orçamento" }

  revalidatePath(`/oficina/orcamentos/${quoteId}`)
  return { success: "Orçamento aprovado" }
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
