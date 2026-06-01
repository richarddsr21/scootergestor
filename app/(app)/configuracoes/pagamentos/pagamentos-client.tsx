"use client"

import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { togglePaymentMethodAction } from "@/lib/actions/settings"
import type { Tables } from "@/types/database"

type Method = Tables<"payment_methods">

const TYPE_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  payment_link: "Link de pagamento",
  bank_slip: "Boleto bancário",
  other: "Outro",
}

export function PagamentosClient({ metodos }: { metodos: Method[] }) {
  async function handleToggle(id: string, active: boolean) {
    const result = await togglePaymentMethodAction(id, active)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
  }

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {metodos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma forma de pagamento encontrada.
          </p>
        )}
        {metodos.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-muted-foreground">{TYPE_LABELS[m.type] ?? m.type}</p>
            </div>
            <Switch
              defaultChecked={m.active}
              onCheckedChange={(checked) => handleToggle(m.id, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
