# Chat de Suporte em Tempo Real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao cliente um chat com o suporte a partir do header do app, e a você (admin) uma caixa de entrada em `/admin/suporte` pra ver e responder, tudo em tempo real via Supabase Realtime.

**Architecture:** Uma conversa por empresa (`support_conversations` + `support_messages`), RLS igual ao resto do schema (`get_current_company_id()` / `is_saas_admin()`), sem tabela de "lido/não lido" por mensagem — não lidas são calculadas comparando `created_at` das mensagens com `*_last_read_at` da conversa. Entrega em tempo real via `postgres_changes` do Supabase Realtime, que respeita RLS automaticamente. Um componente `ChatPanel` compartilhado entre cliente (`Sheet` no header) e admin (página de conversa), parametrizado por `viewerSide`.

**Tech Stack:** Next.js (App Router, Server Actions, Route Handlers), Supabase (Postgres + RLS + Realtime), `@supabase/supabase-js` client-side para as assinaturas realtime, TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-17-chat-suporte-design.md`

## Global Constraints

- Conversa é sempre **por empresa**, nunca por pessoa — `support_conversations.company_id` é `UNIQUE`.
- v1 é só texto — sem anexos/imagens.
- Sem e-mail/push pro admin — só o badge de não lidas dentro do `/admin`.
- Sem múltiplos agentes de suporte, sem arquivar/encerrar conversa, sem indicador de "digitando" (fora de escopo, ver spec).
- **Este projeto não tem test runner configurado** (sem Jest/Vitest). Cada task termina em verificação manual (`tsc --noEmit`, SQL direto, ou clique na UI), mesma convenção do plano `docs/superpowers/plans/2026-08-16-cobranca-recorrente-asaas.md`.
- **Não há CLI do Supabase linkado neste repo.** A migration é aplicada colando o SQL no SQL Editor do painel do Supabase — confirme com o usuário antes de aplicar em produção.

---

## Task 1: Tabelas, RLS, Realtime e tipos

**Files:**
- Create: `supabase/migrations/20260817000001_add_support_chat.sql`
- Modify: `types/database.ts` (dentro do bloco `Tables`, logo depois de `company_invitations`, por volta da linha 806)

**Interfaces:**
- Produces: tabelas `support_conversations` (`id`, `company_id` único, `company_last_read_at`, `admin_last_read_at`, `updated_at`) e `support_messages` (`id`, `conversation_id`, `sender_type` `'company'|'admin'`, `sender_profile_id`, `body`, `created_at`). Usadas por todas as tasks seguintes via `types/database.ts`.

- [ ] **Step 1: Criar a migration**

```sql
-- supabase/migrations/20260817000001_add_support_chat.sql

CREATE TABLE support_conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  company_last_read_at  timestamptz NOT NULL DEFAULT now(),
  admin_last_read_at    timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type       text NOT NULL CHECK (sender_type IN ('company', 'admin')),
  sender_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  body              text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id, created_at);
CREATE INDEX idx_support_conversations_updated ON support_conversations(updated_at DESC);

CREATE OR REPLACE FUNCTION support_touch_conversation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE support_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_messages_touch_conversation
AFTER INSERT ON support_messages
FOR EACH ROW EXECUTE FUNCTION support_touch_conversation();

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_conversations_select ON support_conversations FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_conversations_insert ON support_conversations FOR INSERT
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_conversations_update ON support_conversations FOR UPDATE
  USING (company_id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_messages_select ON support_messages FOR SELECT
  USING (
    is_saas_admin()
    OR conversation_id IN (SELECT id FROM support_conversations WHERE company_id = get_current_company_id())
  );

CREATE POLICY support_messages_insert_company ON support_messages FOR INSERT
  WITH CHECK (
    sender_type = 'company'
    AND conversation_id IN (SELECT id FROM support_conversations WHERE company_id = get_current_company_id())
  );

CREATE POLICY support_messages_insert_admin ON support_messages FOR INSERT
  WITH CHECK (sender_type = 'admin' AND is_saas_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
```

- [ ] **Step 2: Atualizar `types/database.ts`**

Dentro do objeto `Tables` (`types/database.ts`), logo depois do bloco `company_invitations` (que termina com `Relationships: never[]\n      }` antes do fechamento `}` do objeto `Tables`, por volta da linha 806), adicionar:

```ts
      support_conversations: {
        Row: {
          id: string
          company_id: string
          company_last_read_at: string
          admin_last_read_at: string
          updated_at: string
        }
        Insert: Omit<
          Database["public"]["Tables"]["support_conversations"]["Row"],
          "id" | "company_last_read_at" | "admin_last_read_at" | "updated_at"
        > & {
          company_last_read_at?: string
          admin_last_read_at?: string
        }
        Update: Partial<
          Pick<Database["public"]["Tables"]["support_conversations"]["Row"], "company_last_read_at" | "admin_last_read_at">
        >

        Relationships: never[]
      }
      support_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_type: string
          sender_profile_id: string | null
          body: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["support_messages"]["Row"], "id" | "created_at">
        Update: never

        Relationships: never[]
      }
```

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 4: Aplicar a migration**

Cole o SQL do Step 1 no SQL Editor do painel do Supabase e execute. Depois confirme:
- Table Editor → `support_conversations` e `support_messages` existem com as colunas certas.
- Database → Replication → confirme que `support_conversations` e `support_messages` aparecem na lista de tabelas com Realtime habilitado (publication `supabase_realtime`).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260817000001_add_support_chat.sql types/database.ts
git commit -m "feat: adiciona tabelas de chat de suporte (conversas + mensagens)"
```

---

## Task 2: Server actions (`lib/actions/support.ts`)

**Files:**
- Create: `lib/actions/support.ts`

**Interfaces:**
- Consumes: tabelas `support_conversations`/`support_messages` (Task 1).
- Produces (usados pelas Tasks 3-6):
  - `type SupportMessage = { id: string; conversation_id: string; sender_type: "company" | "admin"; sender_profile_id: string | null; body: string; created_at: string }`
  - `getOrCreateConversationAction(): Promise<{ error?: string; conversationId?: string; unreadCount?: number }>`
  - `getConversationMessagesAction(conversationId: string): Promise<{ error?: string; messages?: SupportMessage[] }>`
  - `sendCompanyMessageAction(conversationId: string, body: string): Promise<{ error?: string; message?: SupportMessage }>`
  - `sendAdminMessageAction(conversationId: string, body: string): Promise<{ error?: string; message?: SupportMessage }>`
  - `markConversationReadAction(conversationId: string, side: "company" | "admin"): Promise<{ error?: string }>`
  - `getSupportInboxAction(): Promise<{ error?: string; items?: InboxItem[] }>` com `type InboxItem = { conversationId: string; companyId: string; companyName: string; lastMessageBody: string | null; lastMessageAt: string | null; unreadCount: number }`
  - `getAdminUnreadTotalAction(): Promise<{ error?: string; total?: number }>`

- [ ] **Step 1: Escrever `lib/actions/support.ts`**

```ts
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
    .update({ [column]: new Date().toISOString() })
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

  return { items }
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
```

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

Não há verificação manual isolada nesta task — essas actions não têm UI própria ainda (dependem de sessão autenticada, não dá pra `curl`). Elas são exercitadas de ponta a ponta nas Tasks 4 e 6, quando a UI que as chama existir.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/support.ts
git commit -m "feat: adiciona server actions do chat de suporte"
```

---

## Task 3: Componente compartilhado `ChatPanel`

**Files:**
- Create: `components/support/chat-panel.tsx`

**Interfaces:**
- Consumes: `sendCompanyMessageAction`, `sendAdminMessageAction`, `markConversationReadAction`, `type SupportMessage` (Task 2); `createClient` de `lib/supabase/client.ts` (já existe); `Button`, `Textarea`, `ScrollArea` (`components/ui/*`, já existem).
- Produces: `<ChatPanel conversationId={string} viewerSide={"company" | "admin"} initialMessages={SupportMessage[]} />` — usado pelas Tasks 4 e 6.

- [ ] **Step 1: Escrever `components/support/chat-panel.tsx`**

```tsx
// components/support/chat-panel.tsx
"use client"

import * as React from "react"
import { useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  sendCompanyMessageAction,
  sendAdminMessageAction,
  markConversationReadAction,
  type SupportMessage,
} from "@/lib/actions/support"

interface ChatPanelProps {
  conversationId: string
  viewerSide: "company" | "admin"
  initialMessages: SupportMessage[]
}

function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR })
  } catch {
    return ""
  }
}

export function ChatPanel({ conversationId, viewerSide, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<SupportMessage[]>(initialMessages)
  const [draft, setDraft] = React.useState("")
  const [isSending, startSending] = useTransition()
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    markConversationReadAction(conversationId, viewerSide)
  }, [conversationId, viewerSide])

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`support-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as SupportMessage
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
          markConversationReadAction(conversationId, viewerSide)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, viewerSide])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend() {
    const body = draft.trim()
    if (!body) return

    startSending(async () => {
      const action = viewerSide === "company" ? sendCompanyMessageAction : sendAdminMessageAction
      const result = await action(conversationId, body)
      if (result.message) {
        const sent = result.message
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
        setDraft("")
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-3 py-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma mensagem ainda. Escreva pra começar a conversa.
            </p>
          )}
          {messages.map((m) => {
            const isOwn = m.sender_type === viewerSide
            return (
              <div
                key={m.id}
                className={cn("flex flex-col max-w-[80%]", isOwn ? "self-end items-end" : "self-start items-start")}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {m.body}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground">{relativeTime(m.created_at)}</span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escreva uma mensagem..."
          className="min-h-10 max-h-32 resize-none"
          disabled={isSending}
        />
        <Button size="icon" onClick={handleSend} disabled={isSending || !draft.trim()}>
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  )
}
```

`isOwn` é calculado comparando `sender_type` com `viewerSide` — assim a mesma bolha fica à direita pra quem mandou, dos dois lados (cliente vê as próprias à direita, admin vê as próprias à direita), sem precisar de duas variantes do componente.

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

Sem verificação manual isolada — `ChatPanel` não é montado em nenhuma rota ainda. É testado de ponta a ponta na Task 4.

- [ ] **Step 3: Commit**

```bash
git add components/support/chat-panel.tsx
git commit -m "feat: adiciona componente compartilhado de chat (ChatPanel)"
```

---

## Task 4: Painel do cliente no header

**Files:**
- Create: `components/layout/support-chat.tsx`
- Modify: `components/layout/app-header.tsx`

**Interfaces:**
- Consumes: `getOrCreateConversationAction`, `getConversationMessagesAction`, `type SupportMessage` (Task 2); `ChatPanel` (Task 3); `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle` (`components/ui/sheet.tsx`, já existe).
- Produces: `<SupportChat />` montado no header — não é consumido por nenhuma task seguinte além da UI.

- [ ] **Step 1: Escrever `components/layout/support-chat.tsx`**

```tsx
// components/layout/support-chat.tsx
"use client"

import * as React from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ChatPanel } from "@/components/support/chat-panel"
import { createClient } from "@/lib/supabase/client"
import {
  getOrCreateConversationAction,
  getConversationMessagesAction,
  type SupportMessage,
} from "@/lib/actions/support"

export function SupportChat() {
  const [open, setOpen] = React.useState(false)
  const openRef = React.useRef(false)
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [messages, setMessages] = React.useState<SupportMessage[] | null>(null)

  React.useEffect(() => {
    openRef.current = open
  }, [open])

  React.useEffect(() => {
    getOrCreateConversationAction().then((result) => {
      if (result.conversationId) {
        setConversationId(result.conversationId)
        setUnreadCount(result.unreadCount ?? 0)
      }
    })
  }, [])

  React.useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`support-badge-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as SupportMessage
          if (incoming.sender_type === "admin" && !openRef.current) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setUnreadCount(0)
      if (conversationId && messages === null) {
        getConversationMessagesAction(conversationId).then((result) => {
          setMessages(result.messages ?? [])
        })
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="ghost"
        size="icon"
        className="relative size-9 text-muted-foreground hover:text-foreground"
        onClick={() => handleOpenChange(true)}
      >
        <MessageCircle className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Suporte</span>
      </Button>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b">
          <SheetTitle>Suporte</SheetTitle>
        </SheetHeader>
        {conversationId && messages !== null ? (
          <ChatPanel conversationId={conversationId} viewerSide="company" initialMessages={messages} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Carregando conversa...
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Montar no header**

Em `components/layout/app-header.tsx`, adicionar o import e montar o componente ao lado do `NotificationBell` (linha ~84):

```tsx
import { SupportChat } from "@/components/layout/support-chat"
```

```tsx
        <ThemeToggle />
        <SupportChat />
        <NotificationBell />
```

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação manual**

Com `npm run dev` rodando, logado como um usuário de empresa:
1. Clique no ícone de chat (balão) no header — confirme que abre o painel lateral (`Sheet`) vindo da direita, com "Nenhuma mensagem ainda."
2. Escreva uma mensagem e envie (Enter ou botão) — confirme que ela aparece imediatamente, alinhada à direita.
3. No Table Editor do Supabase, confirme que `support_conversations` tem uma linha nova pra essa empresa e `support_messages` tem a mensagem com `sender_type = 'company'`.
4. Feche e reabra o painel — confirme que a mensagem continua lá (carregada do banco, não só do estado local).
5. Recarregue a página inteira — confirme o mesmo.

- [ ] **Step 5: Commit**

```bash
git add components/layout/support-chat.tsx components/layout/app-header.tsx
git commit -m "feat: adiciona chat de suporte no header do cliente"
```

---

## Task 5: Lista de conversas em `/admin/suporte`

**Files:**
- Create: `app/(admin)/admin/suporte/page.tsx`

**Interfaces:**
- Consumes: `getSupportInboxAction`, `type InboxItem` (Task 2); `Card`/`CardContent` e `Badge` (`components/ui/*`, já existem).
- Produces: rota `/admin/suporte` — a Task 6 adiciona a navegação até ela e a página de conversa individual.

- [ ] **Step 1: Escrever `app/(admin)/admin/suporte/page.tsx`**

```tsx
// app/(admin)/admin/suporte/page.tsx
import Link from "next/link"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getSupportInboxAction } from "@/lib/actions/support"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function relativeTime(iso: string | null) {
  if (!iso) return ""
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR })
  } catch {
    return ""
  }
}

export default async function AdminSuportePage() {
  const { items, error } = await getSupportInboxAction()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground text-sm">
          {error ? error : `${items?.length ?? 0} conversas`}
        </p>
      </div>

      <div className="space-y-2">
        {(items ?? []).map((item) => (
          <Link key={item.conversationId} href={`/admin/suporte/${item.conversationId}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.companyName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.lastMessageBody ?? "Sem mensagens"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">{relativeTime(item.lastMessageAt)}</span>
                  {item.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white hover:bg-red-500">{item.unreadCount}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {items?.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma conversa ainda.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual**

Logado como saas-admin, acesse `/admin/suporte` diretamente pela URL (ainda sem link na navegação — isso vem na Task 6). Confirme que aparece a empresa que mandou mensagem na Task 4, com a última mensagem como preview e badge "1" de não lida (a mensagem da Task 4 foi mandada pelo lado da empresa e ainda não foi lida pelo admin).

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/suporte/page.tsx"
git commit -m "feat: adiciona lista de conversas de suporte no admin"
```

---

## Task 6: Conversa individual do admin + navegação com badge

**Files:**
- Create: `app/(admin)/admin/suporte/[id]/page.tsx`
- Modify: `app/(admin)/layout.tsx`

**Interfaces:**
- Consumes: `getConversationMessagesAction`, `markConversationReadAction`, `getAdminUnreadTotalAction` (Task 2); `ChatPanel` (Task 3).

- [ ] **Step 1: Escrever `app/(admin)/admin/suporte/[id]/page.tsx`**

```tsx
// app/(admin)/admin/suporte/[id]/page.tsx
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversationMessagesAction, markConversationReadAction } from "@/lib/actions/support"
import { ChatPanel } from "@/components/support/chat-panel"

export default async function AdminSupportConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: conversation } = await supabase
    .from("support_conversations")
    .select("id, company_id")
    .eq("id", id)
    .maybeSingle()

  if (!conversation) notFound()

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", conversation.company_id)
    .single()

  const { messages } = await getConversationMessagesAction(id)
  await markConversationReadAction(id, "admin")

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-md border bg-background">
      <div className="border-b p-4">
        <h1 className="font-semibold">{company?.name ?? "Empresa"}</h1>
      </div>
      <ChatPanel conversationId={id} viewerSide="admin" initialMessages={messages ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Adicionar navegação com badge em `app/(admin)/layout.tsx`**

Arquivo atual (`app/(admin)/layout.tsx`) — adicionar o import da action e o item de menu "Suporte" com badge, entre "Empresas" e "Voltar ao app":

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Building2, Home, MessageCircle } from "lucide-react"
import { getAdminUnreadTotalAction } from "@/lib/actions/support"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: isAdmin } = await supabase.rpc("is_saas_admin")
  if (!isAdmin) redirect("/dashboard")

  const { total: unreadTotal } = await getAdminUnreadTotalAction()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="font-semibold">Admin SaaS</span>
          </div>
          <nav className="flex gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin"><Building2 className="mr-1 h-4 w-4" />Empresas</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/suporte">
                <MessageCircle className="mr-1 h-4 w-4" />
                Suporte
                {!!unreadTotal && (
                  <span className="ml-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard"><Home className="mr-1 h-4 w-4" />Voltar ao app</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação manual — round trip completo**

1. Como admin, acesse `/admin` — confirme que o item "Suporte" no menu tem badge "1" (a mensagem da Task 4 ainda não lida).
2. Clique em "Suporte", depois na empresa da lista — abre `/admin/suporte/[id]` com o histórico, incluindo a mensagem do cliente. Confirme que o badge do menu some (marcado como lida ao abrir).
3. Deixe essa aba aberta. Em outra aba/navegador, logado como a empresa, abra o chat pelo header (Task 4) e mantenha o painel aberto.
4. Na aba do admin, responda uma mensagem — confirme que ela aparece **em tempo real** (sem recarregar) na aba do cliente, alinhada à esquerda.
5. Feche o painel do cliente (ou troque de aba). Na aba do admin, mande outra mensagem — confirme que o badge do ícone de chat no header do cliente incrementa sem recarregar a página.
6. Reabra o painel do cliente — confirme que a mensagem nova aparece e o badge some.
7. Teste com dois funcionários da mesma empresa logados em abas diferentes — confirme que os dois veem o mesmo histórico ao abrir o chat (conversa é por empresa).

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/suporte/[id]/page.tsx" "app/(admin)/layout.tsx"
git commit -m "feat: adiciona conversa individual e navegacao de suporte no admin"
```
