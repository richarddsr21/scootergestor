import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Building2, Home } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: isAdmin } = await supabase.rpc("is_saas_admin")
  if (!isAdmin) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="font-semibold">Admin SaaS</span>
          </div>
          <nav className="flex gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin"><Building2 className="mr-1 h-4 w-4" />Empresas</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard"><Home className="mr-1 h-4 w-4" />Voltar ao app</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
