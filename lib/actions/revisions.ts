"use server"

import { createClient } from "@/lib/supabase/server"
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

export type RevisionReminder = {
  id: string
  remind_on: string
  notify_customer: boolean
  notify_store: boolean
  sent_at: string | null
}

export type RevisionSchedule = {
  id: string
  started_at: string
  is_active: boolean
  cancelled_at: string | null
  reminders: RevisionReminder[]
}

export async function getCustomerRevisionAction(customerId: string): Promise<RevisionSchedule | null> {
  const ctx = await getCtx()
  if (!ctx) return null

  const { data: schedule } = await ctx.supabase
    .from("revision_schedules")
    .select("id, started_at, is_active, cancelled_at")
    .eq("company_id", ctx.profile.company_id)
    .eq("customer_id", customerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!schedule) return null

  const { data: reminders } = await ctx.supabase
    .from("revision_reminders")
    .select("id, remind_on, notify_customer, notify_store, sent_at")
    .eq("schedule_id", schedule.id)
    .order("remind_on")

  return { ...schedule, reminders: reminders ?? [] }
}

export async function addRevisionReminderAction(data: {
  customerId: string
  remindOn: string
  notifyCustomer: boolean
  notifyStore: boolean
  sourceOsId?: string | null
  sourceSaleId?: string | null
}): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { data: existing } = await ctx.supabase
    .from("revision_schedules")
    .select("id")
    .eq("company_id", ctx.profile.company_id)
    .eq("customer_id", data.customerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let scheduleId: string

  if (existing) {
    scheduleId = existing.id
  } else {
    const { data: newSchedule, error: scheduleErr } = await ctx.supabase
      .from("revision_schedules")
      .insert({
        company_id: ctx.profile.company_id,
        customer_id: data.customerId,
        source_os_id: data.sourceOsId ?? null,
        source_sale_id: data.sourceSaleId ?? null,
      })
      .select("id")
      .single()

    if (scheduleErr || !newSchedule) return { error: "Erro ao criar revisão" }
    scheduleId = newSchedule.id
  }

  const { error } = await ctx.supabase
    .from("revision_reminders")
    .insert({
      schedule_id: scheduleId,
      company_id: ctx.profile.company_id,
      remind_on: data.remindOn,
      notify_customer: data.notifyCustomer,
      notify_store: data.notifyStore,
    })

  if (error) return { error: "Erro ao adicionar lembrete" }
  return { success: "Lembrete adicionado" }
}

export async function cancelRevisionAction(scheduleId: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("revision_schedules")
    .update({ is_active: false, cancelled_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao cancelar revisão" }
  return { success: "Revisão cancelada" }
}

export async function deleteRevisionReminderAction(reminderId: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("revision_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao remover lembrete" }
  return { success: "Lembrete removido" }
}
