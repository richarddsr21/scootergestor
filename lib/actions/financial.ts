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

const transactionSchema = z.object({
  type: z.enum(["entrada", "saida"], { error: "Tipo inválido" }),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  category_id: z.string().optional(),
  payment_method: z.string().optional(),
  transaction_date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().optional(),
})

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = transactionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { category_id, payment_method, notes: _notes, ...rest } = parsed.data

  const { error } = await ctx.supabase.from("financial_transactions").insert({
    company_id: ctx.profile.company_id,
    created_by: ctx.user.id,
    category_id: category_id && category_id !== "" ? category_id : null,
    payment_method: payment_method && payment_method !== "" ? payment_method : null,
    reference_type: null,
    reference_id: null,
    ...rest,
  })

  if (error) return { error: "Erro ao registrar lançamento" }

  revalidatePath("/financeiro")
  return { success: "Lançamento registrado" }
}

export async function deleteTransactionAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("financial_transactions").delete()
    .eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir lançamento" }

  revalidatePath("/financeiro")
  return { success: "Lançamento excluído" }
}
