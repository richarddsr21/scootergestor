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

  React.useEffect(() => {
    if (open && conversationId && messages === null) {
      getConversationMessagesAction(conversationId).then((result) => {
        setMessages(result.messages ?? [])
      })
    }
  }, [open, conversationId, messages])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setUnreadCount(0)
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
