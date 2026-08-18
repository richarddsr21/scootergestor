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
