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

function n(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? null : (typeof v === "string" ? v.trim() : null)
}

const warrantySchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().min(1, "Cliente é obrigatório"),
  warranty_type: z.enum(["produto", "servico", "bateria", "carregador", "scooter"]),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de término é obrigatória"),
  status: z.enum(["active", "expired", "claimed"]).default("active"),
  product_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  service_order_id: z.string().optional(),
  notes: z.string().optional(),
})

export async function saveWarrantyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = warrantySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, ...fields } = parsed.data
  const data = {
    company_id: ctx.profile.company_id,
    customer_id: fields.customer_id,
    warranty_type: fields.warranty_type,
    start_date: fields.start_date,
    end_date: fields.end_date,
    status: fields.status,
    product_id: fields.product_id === "none" ? null : n(fields.product_id),
    vehicle_id: fields.vehicle_id === "none" ? null : n(fields.vehicle_id),
    service_order_id: fields.service_order_id === "none" ? null : n(fields.service_order_id),
    notes: n(fields.notes),
  }

  if (id) {
    const { error } = await ctx.supabase
      .from("warranties").update(data).eq("id", id).eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar garantia" }
    revalidatePath(`/garantias/${id}`)
    revalidatePath("/garantias")
    return { success: "Garantia atualizada", id }
  }

  const { data: created, error } = await ctx.supabase
    .from("warranties").insert(data).select("id").single()
  if (error) return { error: "Erro ao criar garantia" }

  revalidatePath("/garantias")
  return { success: "Garantia criada", id: created.id }
}

export async function updateWarrantyStatusAction(
  id: string,
  status: "active" | "expired" | "claimed"
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("warranties").update({ status }).eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao atualizar status" }

  revalidatePath(`/garantias/${id}`)
  revalidatePath("/garantias")
  return { success: "Status atualizado" }
}

export async function deleteWarrantyAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("warranties").delete().eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir garantia" }

  revalidatePath("/garantias")
  return { success: "Garantia excluída" }
}
