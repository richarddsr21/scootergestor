import type { SupabaseClient } from "@supabase/supabase-js"

export async function nextServiceOrderNumber(supabase: SupabaseClient, companyId: string) {
  const { data } = await supabase
    .from("service_orders")
    .select("order_number")
    .eq("company_id", companyId)
    .order("order_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastNumber = data?.order_number ? parseInt(data.order_number.replace("OS-", ""), 10) : 0
  return `OS-${String(lastNumber + 1).padStart(5, "0")}`
}
