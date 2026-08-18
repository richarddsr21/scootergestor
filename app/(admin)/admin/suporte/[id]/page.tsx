// app/(admin)/admin/suporte/[id]/page.tsx
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversationMessagesAction } from "@/lib/actions/support"
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

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-md border bg-background">
      <div className="border-b p-4">
        <h1 className="font-semibold">{company?.name ?? "Empresa"}</h1>
      </div>
      <ChatPanel conversationId={id} viewerSide="admin" initialMessages={messages ?? []} />
    </div>
  )
}
