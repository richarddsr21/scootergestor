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

// ─── export lista ─────────────────────────────────────────────────────────────

export interface ExportCustomer {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  cpf_cnpj: string | null
  city: string | null
  state: string | null
  address: string | null
  zip_code: string | null
  notes: string | null
  created_at: string
  os_count: number
  total_pago: number
}

export async function exportCustomersAction(): Promise<ExportCustomer[]> {
  const ctx = await getCtx()
  if (!ctx) return []

  const cid = ctx.profile.company_id

  const [
    { data: customers },
    { data: serviceOrders },
    { data: payments },
    { data: sales },
  ] = await Promise.all([
    ctx.supabase
      .from("customers")
      .select("id, name, phone, whatsapp, email, cpf_cnpj, city, state, address, zip_code, notes, created_at")
      .eq("company_id", cid)
      .order("name"),
    ctx.supabase
      .from("service_orders")
      .select("id, customer_id")
      .eq("company_id", cid),
    ctx.supabase
      .from("payments")
      .select("amount, service_order_id, sale_id")
      .eq("company_id", cid),
    ctx.supabase
      .from("sales")
      .select("id, customer_id")
      .eq("company_id", cid)
      .eq("status", "concluida"),
  ])

  // OS count per customer
  const osCountMap: Record<string, number> = {}
  for (const os of serviceOrders ?? []) {
    if (!os.customer_id) continue
    osCountMap[os.customer_id] = (osCountMap[os.customer_id] ?? 0) + 1
  }

  // Total paid per customer (via OS + via Sales)
  const osCustomerMap = new Map((serviceOrders ?? []).map((o) => [o.id, o.customer_id]))
  const saleCustomerMap = new Map((sales ?? []).map((s) => [s.id, s.customer_id]))
  const totalPaidMap: Record<string, number> = {}
  for (const p of payments ?? []) {
    const customerId = p.service_order_id
      ? osCustomerMap.get(p.service_order_id)
      : p.sale_id
      ? saleCustomerMap.get(p.sale_id)
      : null
    if (!customerId) continue
    totalPaidMap[customerId] = (totalPaidMap[customerId] ?? 0) + p.amount
  }

  return (customers ?? []).map((c) => ({
    ...c,
    os_count: osCountMap[c.id] ?? 0,
    total_pago: totalPaidMap[c.id] ?? 0,
  }))
}

// ─── export ficha individual ──────────────────────────────────────────────────

export interface ClienteOsItem {
  description: string
  item_type: string
  quantity: number
  unit_price: number
  total: number
}

export interface ClienteOsPayment {
  method: string
  amount: number
  installments: number
  paid_at: string | null
}

export interface ClienteOs {
  id: string
  order_number: string
  priority: string
  reported_problem: string
  technical_diagnosis: string | null
  internal_notes: string | null
  labor_total: number
  parts_total: number
  discount: number
  total: number
  payment_status: string
  status_name: string | null
  status_color: string | null
  completed_at: string | null
  delivered_at: string | null
  created_at: string
  items: ClienteOsItem[]
  payments: ClienteOsPayment[]
}

export interface ClienteVehicle {
  id: string
  type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  color: string | null
  battery_type: string | null
  voltage: string | null
  power: string | null
  autonomy: string | null
  warranty_until: string | null
  purchase_date: string | null
  notes: string | null
}

export interface ClienteExportData {
  customer: {
    id: string
    name: string
    phone: string | null
    whatsapp: string | null
    email: string | null
    cpf_cnpj: string | null
    address: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    notes: string | null
    created_at: string
  }
  vehicles: ClienteVehicle[]
  serviceOrders: ClienteOs[]
  stats: {
    totalOs: number
    totalPago: number
    totalPendente: number
    osCompletas: number
  }
}

export async function exportClienteAction(customerId: string): Promise<ClienteExportData | null> {
  const ctx = await getCtx()
  if (!ctx) return null

  const cid = ctx.profile.company_id

  const [
    { data: customer },
    { data: vehicles },
    { data: serviceOrders },
  ] = await Promise.all([
    ctx.supabase
      .from("customers")
      .select("id, name, phone, whatsapp, email, cpf_cnpj, address, city, state, zip_code, notes, created_at")
      .eq("id", customerId)
      .eq("company_id", cid)
      .single(),
    ctx.supabase
      .from("vehicles")
      .select("id, type, brand, model, serial_number, color, battery_type, voltage, power, autonomy, warranty_until, purchase_date, notes")
      .eq("customer_id", customerId)
      .eq("company_id", cid)
      .order("created_at"),
    ctx.supabase
      .from("service_orders")
      .select("id, order_number, priority, reported_problem, technical_diagnosis, internal_notes, labor_total, parts_total, discount, total, payment_status, completed_at, delivered_at, created_at, service_order_statuses(name, color)")
      .eq("customer_id", customerId)
      .eq("company_id", cid)
      .order("created_at", { ascending: false }),
  ])

  if (!customer) return null

  const osIds = (serviceOrders ?? []).map((o) => o.id)

  const [{ data: actualItems }, { data: payments }] = await Promise.all([
    osIds.length > 0
      ? ctx.supabase
          .from("service_order_items")
          .select("service_order_id, description, item_type, quantity, unit_price, total")
          .eq("company_id", cid)
          .in("service_order_id", osIds)
      : Promise.resolve({ data: [] }),
    osIds.length > 0
      ? ctx.supabase
          .from("payments")
          .select("service_order_id, method, amount, installments, paid_at")
          .eq("company_id", cid)
          .in("service_order_id", osIds)
      : Promise.resolve({ data: [] }),
  ])

  const itemsByOs = new Map<string, ClienteOsItem[]>()
  for (const item of (actualItems ?? []) as any[]) {
    const arr = itemsByOs.get(item.service_order_id) ?? []
    arr.push({ description: item.description, item_type: item.item_type, quantity: item.quantity, unit_price: item.unit_price, total: item.total })
    itemsByOs.set(item.service_order_id, arr)
  }

  const paymentsByOs = new Map<string, ClienteOsPayment[]>()
  for (const p of (payments ?? []) as any[]) {
    if (!p.service_order_id) continue
    const arr = paymentsByOs.get(p.service_order_id) ?? []
    arr.push({ method: p.method, amount: p.amount, installments: p.installments, paid_at: p.paid_at })
    paymentsByOs.set(p.service_order_id, arr)
  }

  const mappedOs: ClienteOs[] = (serviceOrders ?? []).map((os: any) => ({
    id: os.id,
    order_number: os.order_number,
    priority: os.priority,
    reported_problem: os.reported_problem,
    technical_diagnosis: os.technical_diagnosis,
    internal_notes: os.internal_notes,
    labor_total: os.labor_total,
    parts_total: os.parts_total,
    discount: os.discount,
    total: os.total,
    payment_status: os.payment_status,
    status_name: os.service_order_statuses?.name ?? null,
    status_color: os.service_order_statuses?.color ?? null,
    completed_at: os.completed_at,
    delivered_at: os.delivered_at,
    created_at: os.created_at,
    items: itemsByOs.get(os.id) ?? [],
    payments: paymentsByOs.get(os.id) ?? [],
  }))

  const totalPago = mappedOs.reduce((s, o) => s + o.payments.reduce((ps, p) => ps + p.amount, 0), 0)
  const totalPendente = mappedOs
    .filter((o) => o.payment_status !== "pago")
    .reduce((s, o) => s + o.total, 0)

  return {
    customer,
    vehicles: vehicles ?? [],
    serviceOrders: mappedOs,
    stats: {
      totalOs: mappedOs.length,
      totalPago,
      totalPendente,
      osCompletas: mappedOs.filter((o) => o.completed_at).length,
    },
  }
}
