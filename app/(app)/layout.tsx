import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AuthProvider } from "@/components/providers/auth-provider"
import { manrope, inter, jetbrainsMono } from "./fonts"
import type { Profile, Company } from "@/types/app"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const supabase = await createClient()
  const [{ data: company }, { data: lowStockProducts }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", profile.company_id).single(),
    supabase
      .from("products")
      .select("stock_quantity, minimum_stock")
      .eq("company_id", profile.company_id)
      .eq("status", "active"),
  ])
  const lowStockCount = (lowStockProducts ?? []).filter(
    (p) => p.stock_quantity <= p.minimum_stock
  ).length

  if (!company) redirect("/onboarding")

  const now = new Date()
  const trialExpired =
    company.status === "trial" &&
    company.trial_ends_at !== null &&
    new Date(company.trial_ends_at) < now
  const overdueTooLong =
    company.payment_overdue_since !== null &&
    now.getTime() - new Date(company.payment_overdue_since).getTime() > 3 * 24 * 60 * 60 * 1000
  const blocked = company.status === "suspended" || trialExpired || overdueTooLong

  if (blocked) redirect("/assinatura")

  let trialDaysLeft: number | null = null
  if (company.status === "trial" && company.trial_ends_at) {
    const msLeft = new Date(company.trial_ends_at).getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000))
    if (daysLeft <= 3) trialDaysLeft = daysLeft
  }

  return (
    <AuthProvider
      profile={profile as Profile}
      company={company as Company}
    >
      <AppShell
        profile={profile as Profile}
        companyName={company.name}
        lowStockCount={lowStockCount ?? 0}
        trialDaysLeft={trialDaysLeft}
        fontVariables={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
