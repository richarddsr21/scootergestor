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

const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
})

function n(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? null : (typeof v === "string" ? v.trim() : null)
}

export async function saveSupplierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, name, email, ...rest } = parsed.data
  const data = {
    company_id: ctx.profile.company_id,
    name: name.trim(),
    cnpj: n(rest.cnpj),
    phone: n(rest.phone),
    whatsapp: n(rest.whatsapp),
    email: n(email),
    address: n(rest.address),
    notes: n(rest.notes),
  }

  if (id) {
    const { error } = await ctx.supabase
      .from("suppliers").update(data).eq("id", id).eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar fornecedor" }
    revalidatePath(`/fornecedores/${id}`)
    revalidatePath("/fornecedores")
    return { success: "Fornecedor atualizado", id }
  }

  const { data: created, error } = await ctx.supabase
    .from("suppliers").insert(data).select("id").single()
  if (error) return { error: "Erro ao criar fornecedor" }

  revalidatePath("/fornecedores")
  return { success: "Fornecedor criado", id: created.id }
}

export async function deleteSupplierAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("suppliers").delete().eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) {
    if (error.message.includes("foreign key"))
      return { error: "Fornecedor possui registros vinculados e não pode ser excluído" }
    return { error: "Erro ao excluir fornecedor" }
  }

  revalidatePath("/fornecedores")
  return { success: "Fornecedor excluído" }
}
