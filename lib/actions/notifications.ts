"use server"

import { createClient } from "@/lib/supabase/server"

export type NotificationItem = {
  id: string
  type: "low_stock" | "overdue_os" | "quote_approved" | "quote_rejected" | "warranty_expiring" | "revision_due"
  title: string
  description: string
  href: string
  date: string | null
}

export type NotificationsData = {
  items: NotificationItem[]
  total: number
}

export async function getNotificationsAction(): Promise<NotificationsData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [], total: 0 }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single()
  if (!profile) return { items: [], total: 0 }

  const cid = profile.company_id
  const now = new Date().toISOString()
  const today = now.split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [
    { data: products },
    { data: overdueOs },
    { data: approvedQuotes },
    { data: rejectedQuotes },
    { data: expiringWarranties },
    { data: dueReminders },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, stock_quantity, minimum_stock")
      .eq("company_id", cid)
      .eq("status", "active"),
    supabase
      .from("service_orders")
      .select("id, order_number, expected_delivery_at, customers(name)")
      .eq("company_id", cid)
      .lt("expected_delivery_at", now)
      .is("delivered_at", null)
      .not("expected_delivery_at", "is", null)
      .order("expected_delivery_at", { ascending: true })
      .limit(5),
    supabase
      .from("quotes")
      .select("id, quote_number, approved_at, customers(name)")
      .eq("company_id", cid)
      .eq("status", "aprovado")
      .gte("approved_at", sevenDaysAgo)
      .order("approved_at", { ascending: false })
      .limit(5),
    supabase
      .from("quotes")
      .select("id, quote_number, rejected_at, customers(name)")
      .eq("company_id", cid)
      .eq("status", "rejeitado")
      .gte("rejected_at", sevenDaysAgo)
      .order("rejected_at", { ascending: false })
      .limit(5),
    supabase
      .from("warranties")
      .select("id, end_date, warranty_type, customers(name), products(name)")
      .eq("company_id", cid)
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", sevenDaysAhead)
      .order("end_date", { ascending: true })
      .limit(5),
    supabase
      .from("revision_reminders")
      .select("id, remind_on, revision_schedules!inner(customer_id, is_active, customers(id, name))")
      .eq("company_id", cid)
      .eq("notify_store", true)
      .is("sent_at", null)
      .lte("remind_on", today)
      .order("remind_on", { ascending: true })
      .limit(5),
  ])

  const items: NotificationItem[] = []

  // Low stock
  const lowStock = (products ?? []).filter((p) => p.stock_quantity <= p.minimum_stock)
  for (const p of lowStock.slice(0, 5)) {
    items.push({
      id: `ls-${p.id}`,
      type: "low_stock",
      title: "Estoque baixo",
      description: `${p.name} — ${p.stock_quantity} un. (mín. ${p.minimum_stock})`,
      href: "/estoque",
      date: null,
    })
  }

  // Overdue OS
  for (const os of overdueOs ?? []) {
    const customer = Array.isArray(os.customers) ? os.customers[0] : os.customers
    items.push({
      id: `os-${os.id}`,
      type: "overdue_os",
      title: `OS #${os.order_number} atrasada`,
      description: `Cliente: ${customer?.name ?? "—"}`,
      href: `/oficina/${os.id}`,
      date: os.expected_delivery_at,
    })
  }

  // Approved quotes
  for (const q of approvedQuotes ?? []) {
    const customer = Array.isArray(q.customers) ? q.customers[0] : q.customers
    items.push({
      id: `qa-${q.id}`,
      type: "quote_approved",
      title: `Orçamento #${q.quote_number} aprovado`,
      description: `Cliente: ${customer?.name ?? "—"}`,
      href: `/oficina/orcamentos`,
      date: q.approved_at,
    })
  }

  // Rejected quotes
  for (const q of rejectedQuotes ?? []) {
    const customer = Array.isArray(q.customers) ? q.customers[0] : q.customers
    items.push({
      id: `qr-${q.id}`,
      type: "quote_rejected",
      title: `Orçamento #${q.quote_number} rejeitado`,
      description: `Cliente: ${customer?.name ?? "—"}`,
      href: `/oficina/orcamentos`,
      date: q.rejected_at,
    })
  }

  // Expiring warranties
  for (const w of expiringWarranties ?? []) {
    const customer = Array.isArray(w.customers) ? w.customers[0] : w.customers
    const product = Array.isArray(w.products) ? w.products[0] : w.products
    items.push({
      id: `w-${w.id}`,
      type: "warranty_expiring",
      title: "Garantia vencendo",
      description: `${customer?.name ?? "—"}${product?.name ? ` · ${product.name}` : ""}`,
      href: "/garantias",
      date: w.end_date,
    })
  }

  // Due revision reminders
  for (const r of dueReminders ?? []) {
    const schedule = Array.isArray((r as any).revision_schedules) ? (r as any).revision_schedules[0] : (r as any).revision_schedules
    if (!schedule?.is_active) continue
    const customer = Array.isArray(schedule.customers) ? schedule.customers[0] : schedule.customers
    const customerId = customer?.id ?? schedule.customer_id
    items.push({
      id: `rev-${r.id}`,
      type: "revision_due",
      title: "Revisão pendente",
      description: `${customer?.name ?? "—"} — lembrete de revisão`,
      href: customerId ? `/clientes/${customerId}` : "/clientes",
      date: (r as any).remind_on,
    })
  }

  return { items, total: items.length }
}
