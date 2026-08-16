"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionState } from "./auth"

export async function adminSetCompanyStatusAction(
  companyId: string,
  status: "active" | "suspended"
): Promise<ActionState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", companyId)

  if (error) return { error: "Não foi possível atualizar o status da empresa" }

  revalidatePath("/admin/[id]", "page")
  return { success: status === "active" ? "Empresa ativada" : "Empresa suspensa" }
}
