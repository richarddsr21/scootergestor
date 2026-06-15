import type { CashMovement, CashSummary } from "./actions/cash"

export const METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit_card: "Cartão de Débito",
  credit_card: "Cartão de Crédito",
  payment_link: "Link de Pagamento",
  bank_slip: "Boleto",
}

export function buildSummary(
  initialAmount: number,
  movements: CashMovement[],
  actualCash: number | null
): CashSummary {
  const entries = movements.filter((m) => m.type === "entry")
  const sangrias = movements.filter((m) => m.type === "sangria")

  const byMethod: Record<string, number> = {}
  for (const m of entries) {
    byMethod[m.payment_method] = (byMethod[m.payment_method] ?? 0) + m.amount
  }

  const entries_by_method = Object.entries(byMethod).map(([method, total]) => ({
    method,
    label: METHOD_LABELS[method] ?? method,
    total,
  }))

  const total_entries = entries.reduce((s, m) => s + m.amount, 0)
  const total_sangrias = sangrias.reduce((s, m) => s + m.amount, 0)
  const cash_entries = entries
    .filter((m) => m.payment_method === "cash")
    .reduce((s, m) => s + m.amount, 0)
  const expected_cash = initialAmount + cash_entries - total_sangrias

  return {
    initial_amount: initialAmount,
    entries_by_method,
    total_entries,
    total_sangrias,
    expected_cash,
    actual_cash: actualCash,
    difference: actualCash !== null ? actualCash - expected_cash : null,
  }
}
