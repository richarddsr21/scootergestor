"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, Package, Wrench, FileText, ShieldAlert, Loader2, CalendarClock } from "lucide-react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getNotificationsAction, type NotificationItem } from "@/lib/actions/notifications"

// ─── dismissed IDs store (localStorage, expires after 48h) ───────────────────

const STORAGE_KEY = "sg_dismissed_notifs"
const TTL_MS = 48 * 60 * 60 * 1000

type DismissedEntry = { id: string; at: number }

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const entries: DismissedEntry[] = JSON.parse(raw)
    const cutoff = Date.now() - TTL_MS
    return new Set(entries.filter((e) => e.at > cutoff).map((e) => e.id))
  } catch {
    return new Set()
  }
}

function writeDismissed(ids: Set<string>) {
  try {
    const entries: DismissedEntry[] = [...ids].map((id) => ({ id, at: Date.now() }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {}
}

// ─── config ──────────────────────────────────────────────────────────────────

const typeConfig = {
  low_stock:         { icon: Package,      color: "text-amber-500",  bg: "bg-amber-500/10"  },
  overdue_os:        { icon: Wrench,       color: "text-red-500",    bg: "bg-red-500/10"    },
  quote_approved:    { icon: FileText,     color: "text-green-500",  bg: "bg-green-500/10"  },
  quote_rejected:    { icon: FileText,     color: "text-red-400",    bg: "bg-red-400/10"    },
  warranty_expiring: { icon: ShieldAlert,  color: "text-orange-500", bg: "bg-orange-500/10" },
  revision_due:      { icon: CalendarClock, color: "text-blue-500",  bg: "bg-blue-500/10"   },
}

function relativeDate(date: string | null) {
  if (!date) return null
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: ptBR })
  } catch {
    return null
  }
}

// ─── row ─────────────────────────────────────────────────────────────────────

function NotificationRow({ item, onClose }: { item: NotificationItem; onClose: () => void }) {
  const cfg = typeConfig[item.type]
  const Icon = cfg.icon
  const ago = relativeDate(item.date)

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/60 transition-colors"
    >
      <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
        <Icon className={cn("size-3.5", cfg.color)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        {ago && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{ago}</p>}
      </div>
    </Link>
  )
}

// ─── bell ────────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<NotificationItem[] | null>(null)

  async function fetchNotifications(force = false) {
    if (data !== null && !force) return
    setLoading(true)
    try {
      const result = await getNotificationsAction()
      const dismissed = readDismissed()
      setData(result.items.filter((item) => !dismissed.has(item.id)))
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) fetchNotifications()
  }

  function refresh() {
    setData(null)
    fetchNotifications(true)
  }

  function clearAll() {
    if (!data) return
    const dismissed = readDismissed()
    data.forEach((item) => dismissed.add(item.id))
    writeDismissed(dismissed)
    setData([])
  }

  const count = data?.length ?? 0

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
          {data !== null && count > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          {data !== null && (
            <div className="flex items-center gap-3">
              {data.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={refresh}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Atualizar
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && data !== null && data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
          </div>
        )}

        {!loading && data !== null && data.length > 0 && (
          <ScrollArea className="max-h-96">
            <div className="py-1">
              {data.map((item) => (
                <NotificationRow key={item.id} item={item} onClose={() => setOpen(false)} />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
