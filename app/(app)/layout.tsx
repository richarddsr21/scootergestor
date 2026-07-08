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

  return (
    <AuthProvider
      profile={profile as Profile}
      company={company as Company}
    >
      <AppShell
        profile={profile as Profile}
        companyName={company.name}
        lowStockCount={lowStockCount ?? 0}
        fontVariables={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
