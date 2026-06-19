"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionState } from "./auth"
import type { SupabaseClient } from "@supabase/supabase-js"
import { buildSummary } from "@/lib/cash-utils"

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("id, company_id").eq("user_id", user.id).single()
  if (!profile) return null
  return { supabase, profile }
}

export type CashRegister = {
  id: string
  company_id: string
  opened_by: string
  opened_at: string
  closed_by: string | null
  closed_at: string | null
  initial_amount: number
  actual_cash_amount: number | null
  status: string
  notes: string | null
  created_at: string
  opener_name?: string
  closer_name?: string
}

export type CashMovement = {
  id: string
  cash_register_id: string
  type: string
  payment_method: string
  amount: number
  description: string | null
  source_type: string | null
  source_id: string | null
  created_at: string
  creator_name?: string
}

export type CashSummary = {
  initial_amount: number
  entries_by_method: { method: string; label: string; total: number }[]
  total_entries: number
  total_sangrias: number
  expected_cash: number
  actual_cash: number | null
  difference: number | null
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function findOpenRegister(supabase: SupabaseClient, companyId: string) {
  const { data } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "open")
    .maybeSingle()
  return data
}

// ─── public actions ──────────────────────────────────────────────────────────

export async function getOpenCashRegisterAction(): Promise<CashRegister | null> {
  const ctx = await getCtx()
  if (!ctx) return null

  const register = await findOpenRegister(ctx.supabase, ctx.profile.company_id)
  if (!register) return null

  const { data: opener } = await ctx.supabase
    .from("profiles").select("name").eq("id", register.opened_by).single()

  return { ...register, opener_name: opener?.name }
}

export async function openCashRegisterAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const existing = await findOpenRegister(ctx.supabase, ctx.profile.company_id)
  if (existing) return { error: "Já existe um caixa aberto. Feche-o antes de abrir um novo." }

  const raw = formData.get("initial_amount")
  const initial_amount = parseFloat(String(raw ?? "0").replace(",", "."))
  if (isNaN(initial_amount) || initial_amount < 0) return { error: "Valor de fundo inválido" }

  const { error } = await ctx.supabase.from("cash_registers").insert({
    company_id: ctx.profile.company_id,
    opened_by: ctx.profile.id,
    initial_amount,
    status: "open",
  })

  if (error) return { error: "Erro ao abrir caixa" }

  revalidatePath("/caixa")
  revalidatePath("/vendas/nova")
  return { success: "Caixa aberto com sucesso" }
}

export async function addSangriaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const register = await findOpenRegister(ctx.supabase, ctx.profile.company_id)
  if (!register) return { error: "Nenhum caixa aberto" }

  const raw = formData.get("amount")
  const amount = parseFloat(String(raw ?? "0").replace(",", "."))
  if (isNaN(amount) || amount <= 0) return { error: "Valor inválido" }

  const description = String(formData.get("description") ?? "").trim() || null

  const { error } = await ctx.supabase.from("cash_movements").insert({
    company_id: ctx.profile.company_id,
    cash_register_id: register.id,
    type: "sangria",
    payment_method: "cash",
    amount,
    description,
    source_type: "manual",
    created_by: ctx.profile.id,
  })

  if (error) return { error: "Erro ao registrar sangria" }

  revalidatePath("/caixa")
  return { success: "Sangria registrada" }
}

export async function closeCashRegisterAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const register = await findOpenRegister(ctx.supabase, ctx.profile.company_id)
  if (!register) return { error: "Nenhum caixa aberto" }

  const raw = String(formData.get("actual_cash_amount") ?? "").trim()
  let actual_cash_amount: number | null = null
  if (raw !== "") {
    const parsed = parseFloat(raw.replace(",", "."))
    if (isNaN(parsed) || parsed < 0) return { error: "Valor de dinheiro inválido" }
    actual_cash_amount = parsed
  }

  const notes = String(formData.get("notes") ?? "").trim() || null
  const now = new Date().toISOString()

  const { error } = await ctx.supabase
    .from("cash_registers")
    .update({
      status: "closed",
      closed_by: ctx.profile.id,
      closed_at: now,
      actual_cash_amount,
      notes,
    })
    .eq("id", register.id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao fechar caixa" }

  revalidatePath("/caixa")
  revalidatePath("/caixa/historico")
  return { success: "Caixa fechado com sucesso" }
}

export async function getCashMovementsAction(registerId: string): Promise<CashMovement[]> {
  const ctx = await getCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from("cash_movements")
    .select("*, profiles(name)")
    .eq("cash_register_id", registerId)
    .eq("company_id", ctx.profile.company_id)
    .order("created_at", { ascending: false })

  return (data ?? []).map((m: any) => ({
    ...m,
    creator_name: m.profiles?.name ?? null,
  }))
}

export async function listCashRegistersAction(page = 1, pageSize = 20) {
  const ctx = await getCtx()
  if (!ctx) return { data: [], count: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count } = await ctx.supabase
    .from("cash_registers")
    .select("*, opener:profiles!cash_registers_opened_by_fkey(name), closer:profiles!cash_registers_closed_by_fkey(name)", { count: "exact" })
    .eq("company_id", ctx.profile.company_id)
    .order("opened_at", { ascending: false })
    .range(from, to)

  return {
    data: (data ?? []).map((r: any) => ({
      ...r,
      opener_name: r.opener?.name ?? null,
      closer_name: r.closer?.name ?? null,
    })) as CashRegister[],
    count: count ?? 0,
  }
}

export async function getCashRegisterDetailAction(id: string): Promise<{
  register: CashRegister
  movements: CashMovement[]
  summary: CashSummary
} | null> {
  const ctx = await getCtx()
  if (!ctx) return null

  const { data: register } = await ctx.supabase
    .from("cash_registers")
    .select("*, opener:profiles!cash_registers_opened_by_fkey(name), closer:profiles!cash_registers_closed_by_fkey(name)")
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)
    .single()

  if (!register) return null

  const { data: movs } = await ctx.supabase
    .from("cash_movements")
    .select("*, profiles(name)")
    .eq("cash_register_id", id)
    .eq("company_id", ctx.profile.company_id)
    .order("created_at", { ascending: true })

  const movements: CashMovement[] = (movs ?? []).map((m: any) => ({
    ...m,
    creator_name: m.profiles?.name ?? null,
  }))

  const reg: CashRegister = {
    ...register,
    opener_name: (register as any).opener?.name ?? null,
    closer_name: (register as any).closer?.name ?? null,
  }

  return {
    register: reg,
    movements,
    summary: buildSummary(reg.initial_amount, movements, reg.actual_cash_amount),
  }
}

// ─── internal: chamado ao registrar pagamentos ────────────────────────────────

export async function insertCashMovementsForPayment(
  supabase: SupabaseClient,
  companyId: string,
  profileId: string,
  sourceType: "service_order" | "sale",
  sourceId: string,
  label: string,
  entries: { method: string; amount: number }[]
) {
  const register = await findOpenRegister(supabase, companyId)
  if (!register) return

  await supabase.from("cash_movements").insert(
    entries.map((e) => ({
      company_id: companyId,
      cash_register_id: register.id,
      type: "entry",
      payment_method: e.method,
      amount: e.amount,
      description: label,
      source_type: sourceType,
      source_id: sourceId,
      created_by: profileId,
    }))
  )
}
