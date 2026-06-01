"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

export type ActionState = { error?: string; success?: string }

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
})

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

// ---------------------------------------------------------------------------
export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message.includes("Invalid login credentials"))
      return { error: "E-mail ou senha incorretos" }
    if (error.message.includes("Email not confirmed"))
      return { error: "Confirme seu e-mail antes de entrar" }
    return { error: "Erro ao fazer login. Tente novamente." }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()
    if (!profile) redirect("/onboarding")
  }

  redirect("/dashboard")
}

// ---------------------------------------------------------------------------
export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const inviteToken = (formData.get("inviteToken") as string | null)?.trim() || null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const emailRedirectTo = inviteToken
    ? `${appUrl}/auth/callback?next=/aceitar-convite?token=${inviteToken}`
    : `${appUrl}/auth/callback?next=/onboarding`

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes("already registered"))
      return { error: "Este e-mail já está cadastrado" }
    return { error: "Erro ao criar conta. Tente novamente." }
  }

  // If email confirmation is disabled, user is logged in immediately
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    if (inviteToken) redirect(`/aceitar-convite?token=${inviteToken}`)
    redirect("/onboarding")
  }

  return {
    success:
      "Conta criada! Verifique seu e-mail para confirmar antes de entrar.",
  }
}

// ---------------------------------------------------------------------------
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string
  if (!email || !z.string().email().safeParse(email).success)
    return { error: "E-mail inválido" }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/redefinir-senha`,
  })

  if (error) return { error: "Erro ao enviar e-mail. Tente novamente." }
  return { success: "E-mail enviado! Verifique sua caixa de entrada." }
}

// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!password || password.length < 8)
    return { error: "Senha deve ter pelo menos 8 caracteres" }
  if (password !== confirmPassword)
    return { error: "As senhas não coincidem" }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error)
    return { error: "Erro ao redefinir senha. O link pode ter expirado." }

  redirect("/dashboard")
}

// ---------------------------------------------------------------------------
export async function createCompanyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const companyName = (formData.get("companyName") as string)?.trim()
  const companySlug = (formData.get("companySlug") as string)?.trim()
  const ownerName = (formData.get("ownerName") as string)?.trim()

  if (!companyName || companyName.length < 2)
    return { error: "Nome da empresa é obrigatório" }
  if (!companySlug || !/^[a-z0-9-]{2,}$/.test(companySlug))
    return { error: "Identificador inválido (use letras minúsculas, números e hífens)" }
  if (!ownerName || ownerName.length < 2)
    return { error: "Seu nome é obrigatório" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase.rpc("create_company_with_owner", {
    p_company_name: companyName,
    p_company_slug: companySlug,
    p_owner_name: ownerName,
    p_owner_email: user.email!,
  })

  if (error) {
    if (error.message.includes("slug_taken"))
      return { error: "Este identificador já está em uso. Tente outro." }
    if (error.message.includes("already_has_company"))
      redirect("/dashboard")
    return { error: "Erro ao criar empresa. Tente novamente." }
  }

  redirect("/dashboard")
}
