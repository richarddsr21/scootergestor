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
    .from("profiles").select("id, company_id").eq("user_id", user.id).single()
  if (!profile) return null
  return { supabase, user, profile }
}

const adjustSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  quantity: z.coerce.number().int(),
  notes: z.string().optional(),
})

export async function adjustStockAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = adjustSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { product_id, quantity, notes } = parsed.data

  const { data: product } = await ctx.supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", product_id)
    .eq("company_id", ctx.profile.company_id)
    .single()

  if (!product) return { error: "Produto não encontrado" }

  const newQty = product.stock_quantity + quantity
  if (newQty < 0) return { error: "Estoque não pode ficar negativo" }

  const type = quantity >= 0 ? "entrada" : "saida"

  const { error: movErr } = await ctx.supabase.from("stock_movements").insert({
    company_id: ctx.profile.company_id,
    product_id,
    type,
    reason: "ajuste_manual",
    quantity: Math.abs(quantity),
    previous_quantity: product.stock_quantity,
    new_quantity: newQty,
    user_id: ctx.user.id,
    notes: notes?.trim() || null,
    reference_type: null,
    reference_id: null,
  })

  if (movErr) return { error: "Erro ao registrar movimentação" }

  const { error: updErr } = await ctx.supabase
    .from("products").update({ stock_quantity: newQty })
    .eq("id", product_id).eq("company_id", ctx.profile.company_id)

  if (updErr) return { error: "Erro ao atualizar estoque" }

  revalidatePath("/estoque")
  revalidatePath(`/produtos/${product_id}`)
  return { success: "Estoque ajustado com sucesso" }
}
