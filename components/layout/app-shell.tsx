"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AppBottomNav } from "@/components/layout/app-bottom-nav"
import type { Profile } from "@/types/app"

interface AppShellProps {
  children: React.ReactNode
  profile: Profile
  companyName?: string | null
  lowStockCount?: number
  fontVariables: string
}

export function AppShell({
  children,
  profile,
  companyName,
  lowStockCount = 0,
  fontVariables,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  React.useEffect(() => {
    const classes = ["app-theme", ...fontVariables.split(" ").filter(Boolean)]
    document.body.classList.add(...classes)
    return () => {
      document.body.classList.remove(...classes)
    }
  }, [fontVariables])

  React.useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--brand-teal-glow),transparent_60%)] opacity-60" />

      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        companyName={companyName ?? undefined}
        lowStockCount={lowStockCount}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader profile={profile} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <AppBottomNav lowStockCount={lowStockCount} />
      </div>
    </div>
  )
}
