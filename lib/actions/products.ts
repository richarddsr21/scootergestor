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

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  category_id: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  description: z.string().optional(),
  cost_price: z.coerce.number().nonnegative("Preço de custo inválido").default(0),
  sale_price: z.coerce.number().nonnegative("Preço de venda inválido").default(0),
  stock_quantity: z.coerce.number().int().nonnegative().default(0),
  minimum_stock: z.coerce.number().int().nonnegative().default(0),
  unit: z.string().min(1, "Unidade é obrigatória").default("un"),
  product_type: z.string().min(1, "Tipo é obrigatório").default("other"),
  requires_chassis: z.coerce.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
})

function n(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? null : (typeof v === "string" ? v.trim() : null)
}

export async function saveProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = productSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, category_id, ...rest } = parsed.data
  const data = {
    company_id: ctx.profile.company_id,
    category_id: category_id === "none" ? null : n(category_id),
    supplier_id: null as string | null,
    image_url: null as string | null,
    ...rest,
    sku: n(rest.sku),
    barcode: n(rest.barcode),
    brand: n(rest.brand),
    model: n(rest.model),
    description: n(rest.description),
  }

  if (id) {
    const { error } = await ctx.supabase
      .from("products").update(data).eq("id", id).eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar produto" }
    revalidatePath(`/produtos/${id}`)
    revalidatePath("/produtos")
    return { success: "Produto atualizado", id }
  }

  const { data: created, error } = await ctx.supabase
    .from("products").insert(data).select("id").single()
  if (error) return { error: "Erro ao criar produto" }

  revalidatePath("/produtos")
  return { success: "Produto criado", id: created.id }
}

export async function deleteProductAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("products").update({ status: "inactive" })
    .eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao inativar produto" }

  revalidatePath("/produtos")
  return { success: "Produto inativado" }
}
