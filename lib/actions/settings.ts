"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionState } from "./auth"

async function getAdminCtx() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile || !["owner", "admin"].includes(profile.role)) return null
  return { supabase, profile }
}

function nullify(v: unknown) {
  if (typeof v === "string") return v.trim() === "" ? null : v.trim()
  return v ?? null
}

// ─── EMPRESA ─────────────────────────────────────────────────────────────────

const companyInfoSchema = z.object({
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  business_name: z.string().optional(),
  legal_name: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  business_hours: z.string().optional(),
  slogan: z.string().optional(),
  notes: z.string().optional(),
})

export async function updateCompanyInfoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const parsed = companyInfoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, ...rest } = parsed.data
  const settings = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, nullify(v)])
  )

  const [companyResult] = await Promise.all([
    ctx.supabase
      .from("companies")
      .update({ name: name.trim() })
      .eq("id", ctx.profile.company_id),
    ctx.supabase
      .from("company_settings")
      .upsert(
        { company_id: ctx.profile.company_id, ...settings },
        { onConflict: "company_id" }
      ),
  ])

  if (companyResult.error) return { error: "Erro ao salvar dados" }

  revalidatePath("/configuracoes/empresa")
  return { success: "Dados salvos com sucesso" }
}

// ─── APARÊNCIA ────────────────────────────────────────────────────────────────

const themeSchema = z.object({
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  app_display_name: z.string().optional(),
  theme_mode: z.enum(["light", "dark", "system"]).default("system"),
})

export async function updateThemeSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const parsed = themeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await ctx.supabase
    .from("company_theme_settings")
    .upsert(
      { company_id: ctx.profile.company_id, ...parsed.data },
      { onConflict: "company_id" }
    )

  if (error) return { error: "Erro ao salvar aparência" }

  revalidatePath("/configuracoes/aparencia")
  return { success: "Aparência salva com sucesso" }
}

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["product", "service"]).default("product"),
  display_order: z.coerce.number().int().nonnegative().default(0),
})

export async function saveCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const parsed = categorySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data

  if (id) {
    const { error } = await ctx.supabase
      .from("product_categories")
      .update({ ...data, description: nullify(data.description) as string | null })
      .eq("id", id)
      .eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar categoria" }
  } else {
    const { error } = await ctx.supabase
      .from("product_categories")
      .insert({ ...data, description: nullify(data.description) as string | null, company_id: ctx.profile.company_id })
    if (error) return { error: "Erro ao criar categoria" }
  }

  revalidatePath("/configuracoes/categorias")
  return { success: id ? "Categoria atualizada" : "Categoria criada" }
}

export async function deleteCategoryAction(id: string): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const { error } = await ctx.supabase
    .from("product_categories")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) {
    if (error.message.includes("foreign key"))
      return { error: "Não é possível excluir: existem produtos nessa categoria" }
    return { error: "Erro ao excluir categoria" }
  }

  revalidatePath("/configuracoes/categorias")
  return { success: "Categoria excluída" }
}

// ─── STATUS DE OS ─────────────────────────────────────────────────────────────

const osStatusSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z
    .string()
    .min(1, "Slug é obrigatório")
    .regex(/^[a-z0-9-]+$/, "Slug: apenas letras minúsculas, números e hífens"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida").default("#6366f1"),
  display_order: z.coerce.number().int().nonnegative().default(0),
  is_default: z.coerce.boolean().default(false),
  is_final: z.coerce.boolean().default(false),
})

export async function saveOsStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const raw: Record<string, unknown> = Object.fromEntries(formData)
  raw.is_default = formData.get("is_default") === "true"
  raw.is_final = formData.get("is_final") === "true"

  const parsed = osStatusSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data

  if (id) {
    const { error } = await ctx.supabase
      .from("service_order_statuses")
      .update(data)
      .eq("id", id)
      .eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar status" }
  } else {
    const { error } = await ctx.supabase
      .from("service_order_statuses")
      .insert({ ...data, company_id: ctx.profile.company_id })
    if (error) return { error: "Erro ao criar status" }
  }

  revalidatePath("/configuracoes/status-os")
  return { success: id ? "Status atualizado" : "Status criado" }
}

export async function deleteOsStatusAction(id: string): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const { error } = await ctx.supabase
    .from("service_order_statuses")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) {
    if (error.message.includes("foreign key"))
      return { error: "Não é possível excluir: há OS com esse status" }
    return { error: "Erro ao excluir status" }
  }

  revalidatePath("/configuracoes/status-os")
  return { success: "Status excluído" }
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────

const checklistItemSchema = z.object({
  id: z.string().optional(),
  template_id: z.string(),
  label: z.string().min(1, "Descrição é obrigatória"),
  input_type: z.enum(["yes_no_na", "text", "number", "checkbox", "select"]).default("yes_no_na"),
  required: z.coerce.boolean().default(false),
  display_order: z.coerce.number().int().nonnegative().default(0),
})

export async function saveChecklistItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const raw: Record<string, unknown> = Object.fromEntries(formData)
  raw.required = formData.get("required") === "true"

  const parsed = checklistItemSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data

  if (id) {
    const { error } = await ctx.supabase
      .from("checklist_template_items")
      .update(data)
      .eq("id", id)
      .eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar item" }
  } else {
    const { error } = await ctx.supabase
      .from("checklist_template_items")
      .insert({ ...data, company_id: ctx.profile.company_id })
    if (error) return { error: "Erro ao criar item" }
  }

  revalidatePath("/configuracoes/checklist")
  return { success: id ? "Item atualizado" : "Item criado" }
}

export async function deleteChecklistItemAction(id: string): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const { error } = await ctx.supabase
    .from("checklist_template_items")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir item" }

  revalidatePath("/configuracoes/checklist")
  return { success: "Item excluído" }
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  default_price: z.coerce.number().nonnegative("Preço deve ser positivo").default(0),
  estimated_minutes: z.coerce.number().int().nonnegative().default(0),
  warranty_days: z.coerce.number().int().nonnegative().default(0),
})

export async function saveServiceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, description, ...data } = parsed.data
  const desc = nullify(description) as string | null

  if (id) {
    const { error } = await ctx.supabase
      .from("services")
      .update({ ...data, description: desc })
      .eq("id", id)
      .eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar serviço" }
  } else {
    const { error } = await ctx.supabase
      .from("services")
      .insert({ ...data, description: desc, company_id: ctx.profile.company_id })
    if (error) return { error: "Erro ao criar serviço" }
  }

  revalidatePath("/configuracoes/servicos")
  return { success: id ? "Serviço atualizado" : "Serviço criado" }
}

export async function deleteServiceAction(id: string): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const { error } = await ctx.supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir serviço" }

  revalidatePath("/configuracoes/servicos")
  return { success: "Serviço excluído" }
}

// ─── GARANTIAS ────────────────────────────────────────────────────────────────

const warrantyRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  warranty_type: z.string().min(1, "Tipo é obrigatório"),
  duration_days: z.coerce.number().int().positive("Prazo deve ser maior que zero"),
  description: z.string().optional(),
})

export async function saveWarrantyRuleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const parsed = warrantyRuleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, description, ...data } = parsed.data
  const desc = nullify(description) as string | null

  if (id) {
    const { error } = await ctx.supabase
      .from("warranty_rules")
      .update({ ...data, description: desc })
      .eq("id", id)
      .eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar regra" }
  } else {
    const { error } = await ctx.supabase
      .from("warranty_rules")
      .insert({ ...data, description: desc, company_id: ctx.profile.company_id })
    if (error) return { error: "Erro ao criar regra" }
  }

  revalidatePath("/configuracoes/garantias")
  return { success: id ? "Regra atualizada" : "Regra criada" }
}

export async function deleteWarrantyRuleAction(id: string): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const { error } = await ctx.supabase
    .from("warranty_rules")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir regra" }

  revalidatePath("/configuracoes/garantias")
  return { success: "Regra excluída" }
}

// ─── FORMAS DE PAGAMENTO ──────────────────────────────────────────────────────

export async function togglePaymentMethodAction(
  id: string,
  active: boolean
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  const { error } = await ctx.supabase
    .from("payment_methods")
    .update({ active })
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao atualizar" }

  revalidatePath("/configuracoes/pagamentos")
  return { success: active ? "Forma ativada" : "Forma desativada" }
}

export interface InstallmentFee {
  installments: number
  fee: number
}

export async function updatePaymentMethodFeesAction(
  id: string,
  feePercent: number,
  installmentFees: InstallmentFee[] | null
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  if (feePercent < 0 || feePercent > 100) return { error: "Taxa inválida" }

  const { error } = await ctx.supabase
    .from("payment_methods")
    .update({
      fee_percent: feePercent,
      installment_fees: installmentFees as unknown as import("@/types/database").Json ?? null,
    })
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: `Erro ao salvar taxas: ${error.message}` }

  revalidatePath("/configuracoes/pagamentos")
  return { success: "Taxas salvas" }
}

// ─── MENSAGENS WHATSAPP ───────────────────────────────────────────────────────

export async function updateMessageTemplateAction(
  id: string,
  content: string
): Promise<ActionState> {
  const ctx = await getAdminCtx()
  if (!ctx) return { error: "Sem permissão" }

  if (!content.trim()) return { error: "Conteúdo não pode ser vazio" }

  const { error } = await ctx.supabase
    .from("message_templates")
    .update({ content: content.trim() })
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao salvar mensagem" }

  revalidatePath("/configuracoes/mensagens")
  return { success: "Mensagem salva" }
}
