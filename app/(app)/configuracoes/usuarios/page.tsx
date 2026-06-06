import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { UsersClient } from "./users-client"
import type { Profile, CompanyInvitation } from "@/types/app"

export default async function UsuariosPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const currentProfile = await getAuthProfile()
  if (!currentProfile) redirect("/onboarding")

  const supabase = await createClient()

  const [{ data: profiles }, { data: invitations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("company_id", currentProfile.company_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("company_invitations")
      .select("*")
      .eq("company_id", currentProfile.company_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ])

  const canManage = ["owner", "admin"].includes(currentProfile.role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os membros da sua equipe e os convites pendentes."
      />
      <UsersClient
        profiles={(profiles ?? []) as Profile[]}
        invitations={(invitations ?? []) as CompanyInvitation[]}
        currentUserId={user.id}
        canManage={canManage}
      />
    </div>
  )
}
