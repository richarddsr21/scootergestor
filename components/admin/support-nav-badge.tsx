"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { getAdminUnreadTotalAction } from "@/lib/actions/support"

export function SupportNavBadge({ initialTotal }: { initialTotal: number }) {
  const [total, setTotal] = React.useState(initialTotal)

  React.useEffect(() => {
    const supabase = createClient()

    function refresh() {
      getAdminUnreadTotalAction().then((result) => {
        if (typeof result.total === "number") setTotal(result.total)
      })
    }

    const channel = supabase
      .channel("admin-support-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_conversations" },
        refresh
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (!total) return null

  return (
    <span className="ml-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
      {total > 9 ? "9+" : total}
    </span>
  )
}
