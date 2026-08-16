"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionState } from "./auth"

export async function adminSetCompanyStatusAction(
  companyId: string,
  status: "active" | "suspended"
): Promise<ActionState> {
  const supabase = await createClient()

  // Defense in depth: the DB now also enforces this via a trigger on
  // `companies` (only is_saas_admin() or the service role may write
  // `status`), but check here too for a clean error message instead of a
  // raw Postgres exception, and because relying on the DB alone is worse
  // UX and worse defense-in-depth than checking twice.
  const { data: isAdmin } = await supabase.rpc("is_saas_admin")
  if (!isAdmin) return { error: "Não autorizado" }

  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", companyId)

  if (error) return { error: "Não foi possível atualizar o status da empresa" }

  revalidatePath("/admin/[id]", "page")
  return { success: status === "active" ? "Empresa ativada" : "Empresa suspensa" }
}
