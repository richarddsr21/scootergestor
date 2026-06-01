import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AuthProvider } from "@/components/providers/auth-provider"
import type { Profile, Company } from "@/types/app"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

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
