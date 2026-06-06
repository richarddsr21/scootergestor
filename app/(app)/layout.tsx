import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AuthProvider } from "@/components/providers/auth-provider"
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
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single()

  if (!company) redirect("/onboarding")

  return (
    <AuthProvider
      profile={profile as Profile}
      company={company as Company}
    >
      <AppShell profile={profile as Profile} companyName={company.name}>
        {children}
      </AppShell>
    </AuthProvider>
  )
}
