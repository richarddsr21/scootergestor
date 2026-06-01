"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionState } from "./auth"

const MANAGEABLE_ROLES = ["admin", "manager", "seller", "technician", "cashier"] as const
const CAN_MANAGE = ["owner", "admin"] as const

const inviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(MANAGEABLE_ROLES, { error: "Função inválida" }),
})

export async function inviteUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { token?: string; inviteUrl?: string }> {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("user_id", user.id)
    .single()

  if (!currentProfile) return { error: "Perfil não encontrado" }
  if (!(CAN_MANAGE as readonly string[]).includes(currentProfile.role))
    return { error: "Sem permissão para convidar usuários" }

  // Check if email is already a member
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", currentProfile.company_id)
    .eq("email", parsed.data.email)
    .maybeSingle()

  if (existing) return { error: "Este e-mail já é membro da empresa" }

  // Cancel any existing pending invitations for this email+company
  await supabase
    .from("company_invitations")
    .update({ status: "cancelled" })
    .eq("company_id", currentProfile.company_id)
    .eq("email", parsed.data.email)
    .eq("status", "pending")

  const { data: invitation, error } = await supabase
    .from("company_invitations")
    .insert({
      company_id: currentProfile.company_id,
      invited_by: currentProfile.id,
      email: parsed.data.email,
      role: parsed.data.role,
    })
    .select("token")
    .single()

  if (error || !invitation) return { error: "Erro ao criar convite. Tente novamente." }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const inviteUrl = `${appUrl}/aceitar-convite?token=${invitation.token}`

  revalidatePath("/configuracoes/usuarios")
  return { success: "Convite criado!", token: invitation.token, inviteUrl }
}

export async function updateUserRoleAction(
  profileId: string,
  role: string
): Promise<ActionState> {
  if (!(MANAGEABLE_ROLES as readonly string[]).includes(role))
    return { error: "Função inválida" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("user_id", user.id)
    .single()

  if (!currentProfile || !(CAN_MANAGE as readonly string[]).includes(currentProfile.role))
    return { error: "Sem permissão" }

  const { data: target } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("id", profileId)
    .eq("company_id", currentProfile.company_id)
    .single()

  if (!target) return { error: "Usuário não encontrado" }
  if (target.user_id === user.id) return { error: "Você não pode alterar sua própria função" }
  if (target.role === "owner") return { error: "Não é possível alterar a função do proprietário" }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId)
    .eq("company_id", currentProfile.company_id)

  if (error) return { error: "Erro ao atualizar função" }

  revalidatePath("/configuracoes/usuarios")
  return { success: "Função atualizada" }
}

export async function toggleUserStatusAction(
  profileId: string,
  activate: boolean
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("user_id", user.id)
    .single()

  if (!currentProfile || !(CAN_MANAGE as readonly string[]).includes(currentProfile.role))
    return { error: "Sem permissão" }

  const { data: target } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("id", profileId)
    .eq("company_id", currentProfile.company_id)
    .single()

  if (!target) return { error: "Usuário não encontrado" }
  if (target.user_id === user.id) return { error: "Você não pode alterar seu próprio status" }
  if (target.role === "owner") return { error: "Não é possível desativar o proprietário" }

  const { error } = await supabase
    .from("profiles")
    .update({ status: activate ? "active" : "inactive" })
    .eq("id", profileId)
    .eq("company_id", currentProfile.company_id)

  if (error) return { error: "Erro ao atualizar status" }

  revalidatePath("/configuracoes/usuarios")
  return { success: activate ? "Usuário ativado" : "Usuário desativado" }
}

export async function cancelInvitationAction(
  invitationId: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("user_id", user.id)
    .single()

  if (!currentProfile || !(CAN_MANAGE as readonly string[]).includes(currentProfile.role))
    return { error: "Sem permissão" }

  const { error } = await supabase
    .from("company_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("company_id", currentProfile.company_id)
    .eq("status", "pending")

  if (error) return { error: "Erro ao cancelar convite" }

  revalidatePath("/configuracoes/usuarios")
  return { success: "Convite cancelado" }
}
