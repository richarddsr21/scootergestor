import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { logoutAction } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export default async function AssinaturaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {children}
      <form action={logoutAction} className="mt-4">
        <button
          type="submit"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Sair e entrar com outra conta
        </button>
      </form>
    </div>
  )
}
