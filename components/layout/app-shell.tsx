"use client"

import * as React from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import type { Profile } from "@/types/app"

interface AppShellProps {
  children: React.ReactNode
  profile: Profile
  companyName?: string | null
}

export function AppShell({ children, profile, companyName }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        companyName={companyName ?? undefined}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
