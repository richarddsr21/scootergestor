// lib/actions/support.ts
"use server"

import { createClient } from "@/lib/supabase/server"

export type SupportMessage = {
  id: string
  conversation_id: string
  sender_type: "company" | "admin"
  sender_profile_id: string | null
  body: string
  created_at: string
}

export type ConversationResult = { error?: string; conversationId?: string; unreadCount?: number }
export type MessagesResult = { error?: string; messages?: SupportMessage[] }
export type SendMessageResult = { error?: string; message?: SupportMessage }
export type MarkReadResult = { error?: string }
export type InboxItem = {
  conversationId: string
  companyId: string
  companyName: string
  lastMessageBody: string | null
  lastMessageAt: string | null
  unreadCount: number
}
export type InboxResult = { error?: string; items?: InboxItem[] }

const MESSAGE_COLUMNS = "id, conversation_id, sender_type, sender_profile_id, body, created_at"

async function getCompanyCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles").select("id, company_id").eq("user_id", user.id).single()
  if (!profile) return null

  return { supabase, profile }
}

export async function getOrCreateConversationAction(): Promise<ConversationResult> {
  const ctx = await getCompanyCtx()
  if (!ctx) return { error: "Não autenticado" }
  const { supabase, profile } = ctx

  let conversation = (
    await supabase
      .from("support_conversations")
      .select("id, company_last_read_at")
      .eq("company_id", profile.company_id)
      .maybeSingle()
  ).data

  if (!conversation) {
    const { data: created, error } = await supabase
      .from("support_conversations")
      .insert({ company_id: profile.company_id })
      .select("id, company_last_read_at")
      .single()

    if (error) {
      // corrida: outro funcionário da mesma empresa criou entre o select e o insert
      const retry = (
        await supabase
          .from("support_conversations")
          .select("id, company_last_read_at")
          .eq("company_id", profile.company_id)
          .maybeSingle()
      ).data
      if (!retry) return { error: "Não foi possível iniciar a conversa" }
      conversation = retry
    } else {
      conversation = created
    }
  }

  const { count } = await supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversation.id)
    .eq("sender_type", "admin")
    .gt("created_at", conversation.company_last_read_at)

  return { conversationId: conversation.id, unreadCount: count ?? 0 }
}

export async function getConversationMessagesAction(conversationId: string): Promise<MessagesResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data, error } = await supabase
    .from("support_messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) return { error: "Não foi possível carregar as mensagens" }
  return { messages: (data ?? []) as SupportMessage[] }
}

export async function sendCompanyMessageAction(conversationId: string, body: string): Promise<SendMessageResult> {
  const trimmed = body.trim()
  if (!trimmed) return { error: "Mensagem vazia" }

  const ctx = await getCompanyCtx()
  if (!ctx) return { error: "Não autenticado" }
  const { supabase, profile } = ctx

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "company",
      sender_profile_id: profile.id,
      body: trimmed,
    })
    .select(MESSAGE_COLUMNS)
    .single()

  if (error) return { error: "Não foi possível enviar a mensagem" }
  return { message: data as SupportMessage }
}

export async function sendAdminMessageAction(conversationId: string, body: string): Promise<SendMessageResult> {
  const trimmed = body.trim()
  if (!trimmed) return { error: "Mensagem vazia" }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc("is_saas_admin")
  if (!isAdmin) return { error: "Não autorizado" }

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "admin",
      sender_profile_id: null,
      body: trimmed,
    })
    .select(MESSAGE_COLUMNS)
    .single()

  if (error) return { error: "Não foi possível enviar a mensagem" }
  return { message: data as SupportMessage }
}

export async function markConversationReadAction(
  conversationId: string,
  side: "company" | "admin"
): Promise<MarkReadResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const column = side === "company" ? "company_last_read_at" : "admin_last_read_at"
  const { error } = await supabase
    .from("support_conversations")
    .update({ [column]: new Date().toISOString() } as any)
    .eq("id", conversationId)

  if (error) return { error: "Não foi possível marcar como lida" }
  return {}
}

export async function getSupportInboxAction(): Promise<InboxResult> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc("is_saas_admin")
  if (!isAdmin) return { error: "Não autorizado" }

  const { data: conversations, error } = await supabase
    .from("support_conversations")
    .select("id, company_id, admin_last_read_at, updated_at")
    .order("updated_at", { ascending: false })

  if (error) return { error: "Não foi possível carregar as conversas" }
  if (!conversations || conversations.length === 0) return { items: [] }

  const companyIds = conversations.map((c) => c.company_id)
  const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds)
  const companyNameById = new Map((companies ?? []).map((c) => [c.id, c.name]))

  const items: InboxItem[] = await Promise.all(
    conversations.map(async (c) => {
      const [{ data: lastMessage }, { count }] = await Promise.all([
        supabase
          .from("support_messages")
          .select("body, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("support_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("sender_type", "company")
          .gt("created_at", c.admin_last_read_at),
      ])

      return {
        conversationId: c.id,
        companyId: c.company_id,
        companyName: companyNameById.get(c.company_id) ?? "Empresa",
        lastMessageBody: lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.created_at ?? null,
        unreadCount: count ?? 0,
      }
    })
  )

  return { items: items.filter((item) => item.lastMessageAt !== null) }
}

export async function getAdminUnreadTotalAction(): Promise<{ error?: string; total?: number }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc("is_saas_admin")
  if (!isAdmin) return { error: "Não autorizado" }

  const { data: conversations } = await supabase
    .from("support_conversations")
    .select("id, admin_last_read_at")

  if (!conversations || conversations.length === 0) return { total: 0 }

  const counts = await Promise.all(
    conversations.map((c) =>
      supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("sender_type", "company")
        .gt("created_at", c.admin_last_read_at)
    )
  )

  const total = counts.reduce((sum, r) => sum + (r.count ?? 0), 0)
  return { total }
}
