import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AcceptInviteClient } from "./accept-invite-client"

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function AceitarConvitePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="text-muted-foreground">
            Este link de convite é inválido ou já expirou.
          </p>
          <Link href="/login" className="underline text-sm">
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Validate token without auth (public read would require service role, so we
  // rely on the client component to call the RPC after login)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, redirect to register with the token preserved
  if (!user) {
    redirect(`/register?invite=${token}`)
  }

  // User is logged in — let the client component call accept_invitation RPC
  return <AcceptInviteClient token={token} />
}
