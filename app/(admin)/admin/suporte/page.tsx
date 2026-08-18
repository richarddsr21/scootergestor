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
