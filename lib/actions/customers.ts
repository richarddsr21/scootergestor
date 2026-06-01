"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionState } from "./auth"

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("id, company_id, role").eq("user_id", user.id).single()
  if (!profile) return null
  return { supabase, user, profile }
}

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf_cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
})

function n(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? null : (typeof v === "string" ? v.trim() : null)
}

export async function saveCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { id?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = customerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, name, email, ...rest } = parsed.data
  const data = {
    company_id: ctx.profile.company_id,
    name: name.trim(),
    email: n(email),
    phone: n(rest.phone),
    whatsapp: n(rest.whatsapp),
    cpf_cnpj: n(rest.cpf_cnpj),
    address: n(rest.address),
    city: n(rest.city),
    state: n(rest.state),
    zip_code: n(rest.zip_code),
    notes: n(rest.notes),
  }

  if (id) {
    const { error } = await ctx.supabase
      .from("customers").update(data).eq("id", id).eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar cliente" }
    revalidatePath(`/clientes/${id}`)
    revalidatePath("/clientes")
    return { success: "Cliente atualizado", id }
  }

  const { data: created, error } = await ctx.supabase
    .from("customers").insert(data).select("id").single()
  if (error) return { error: "Erro ao criar cliente" }

  revalidatePath("/clientes")
  return { success: "Cliente criado", id: created.id }
}

export async function deleteCustomerAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("customers").delete().eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) {
    if (error.message.includes("foreign key"))
      return { error: "Cliente possui registros vinculados e não pode ser excluído" }
    return { error: "Erro ao excluir cliente" }
  }

  revalidatePath("/clientes")
  return { success: "Cliente excluído" }
}

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().min(1),
  type: z.string().min(1, "Tipo é obrigatório"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  color: z.string().optional(),
  battery_type: z.string().optional(),
  voltage: z.string().optional(),
  power: z.string().optional(),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
})

export async function saveVehicleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, customer_id, ...rest } = parsed.data
  const data = {
    company_id: ctx.profile.company_id,
    customer_id,
    type: rest.type,
    brand: n(rest.brand),
    model: n(rest.model),
    serial_number: n(rest.serial_number),
    color: n(rest.color),
    battery_type: n(rest.battery_type),
    voltage: n(rest.voltage),
    power: n(rest.power),
    product_id: null as string | null,
    autonomy: null as string | null,
    warranty_until: null as string | null,
    purchase_date: n(rest.purchase_date),
    notes: n(rest.notes),
  }

  if (id) {
    const { error } = await ctx.supabase
      .from("vehicles").update(data).eq("id", id).eq("company_id", ctx.profile.company_id)
    if (error) return { error: "Erro ao atualizar veículo" }
  } else {
    const { error } = await ctx.supabase.from("vehicles").insert(data)
    if (error) return { error: "Erro ao criar veículo" }
  }

  revalidatePath(`/clientes/${customer_id}`)
  return { success: id ? "Veículo atualizado" : "Veículo adicionado" }
}

export async function deleteVehicleAction(
  id: string,
  customerId: string
): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { error } = await ctx.supabase
    .from("vehicles").delete().eq("id", id).eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir veículo" }

  revalidatePath(`/clientes/${customerId}`)
  return { success: "Veículo removido" }
}
