"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionState } from "./auth"
import { insertCashMovementsForPayment } from "./cash"

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("id, company_id").eq("user_id", user.id).single()
  if (!profile) return null
  return { supabase, user, profile }
}

export interface CartItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  costPrice: number
  discount: number
}

export interface PaymentEntry {
  method: string
  amount: number
  fee_amount: number
  installments: number
}

export async function confirmSaleAction(
  items: CartItem[],
  customerId: string | null,
  discount: number,
  paymentEntries: PaymentEntry[],
  notes: string
): Promise<ActionState & { saleId?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  if (items.length === 0) return { error: "Adicione pelo menos um produto" }
  if (!paymentEntries || paymentEntries.length === 0) return { error: "Selecione a forma de pagamento" }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0)
  const total = Math.max(0, subtotal - discount)

  // Generate sale number
  const { count } = await ctx.supabase
    .from("sales").select("*", { count: "exact", head: true })
    .eq("company_id", ctx.profile.company_id)

  const saleNumber = `VD-${String((count ?? 0) + 1).padStart(5, "0")}`

  // Create sale
  const { data: sale, error: saleErr } = await ctx.supabase
    .from("sales")
    .insert({
      company_id: ctx.profile.company_id,
      customer_id: customerId || null,
      user_id: ctx.user.id,
      sale_number: saleNumber,
      subtotal,
      discount,
      total,
      payment_status: "pago",
      status: "concluida",
      notes: notes.trim() || null,
    })
    .select("id")
    .single()

  if (saleErr || !sale) return { error: "Erro ao criar venda" }

  // Create sale items + update stock (each item processed in parallel)
  await Promise.all(items.map(async (item) => {
    const itemTotal = item.unitPrice * item.quantity - item.discount

    await ctx.supabase.from("sale_items").insert({
      company_id: ctx.profile.company_id,
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      discount: item.discount,
      total: itemTotal,
    })

    const { data: product } = await ctx.supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.productId)
      .eq("company_id", ctx.profile.company_id)
      .single()

    if (product) {
      const prev = product.stock_quantity
      const next = Math.max(0, prev - item.quantity)

      await ctx.supabase.from("stock_movements").insert({
        company_id: ctx.profile.company_id,
        product_id: item.productId,
        type: "saida",
        reason: "venda",
        quantity: item.quantity,
        previous_quantity: prev,
        new_quantity: next,
        reference_type: "sale",
        reference_id: sale.id,
        user_id: ctx.user.id,
        notes: null,
      })

      await ctx.supabase
        .from("products")
        .update({ stock_quantity: next })
        .eq("id", item.productId)
        .eq("company_id", ctx.profile.company_id)
    }
  }))

  // Create payment records in parallel
  await Promise.all(paymentEntries.map((entry) =>
    ctx.supabase.from("payments").insert({
      company_id: ctx.profile.company_id,
      sale_id: sale.id,
      service_order_id: null,
      method: entry.method,
      amount: entry.amount,
      fee_amount: entry.fee_amount,
      installments: entry.installments,
      paid_at: new Date().toISOString(),
    })
  ))

  // Registra no caixa aberto (se houver) — falha silenciosa
  await insertCashMovementsForPayment(
    ctx.supabase,
    ctx.profile.company_id,
    ctx.profile.id,
    "sale",
    sale.id,
    `Venda ${saleNumber}`,
    paymentEntries.map((e) => ({ method: e.method, amount: e.amount }))
  ).catch(() => {})

  revalidatePath("/vendas")
  revalidatePath("/dashboard")
  return { success: "Venda registrada!", saleId: sale.id }
}

export async function cancelSaleAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { data: sale } = await ctx.supabase
    .from("sales")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)
    .single()

  if (!sale) return { error: "Venda não encontrada" }
  if (sale.status === "cancelada") return { error: "Venda já cancelada" }

  const { error } = await ctx.supabase
    .from("sales")
    .update({ status: "cancelada" })
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao cancelar venda" }

  revalidatePath("/vendas")
  revalidatePath(`/vendas/${id}`)
  return { success: "Venda cancelada" }
}
