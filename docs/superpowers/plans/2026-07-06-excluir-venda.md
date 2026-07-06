# Excluir Venda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um botão "Excluir venda" na página `/vendas/[id]` que apaga a venda definitivamente, revertendo estoque, removendo pagamentos/caixa/movimentos de estoque vinculados e, quando aplicável, o veículo criado automaticamente pela venda.

**Architecture:** Nova coluna `vehicles.source_sale_id` para rastrear qual venda originou um veículo. Nova server action `deleteSaleAction` em `lib/actions/sales.ts`, que reaproveita (via um helper extraído) a mesma lógica de reversão de estoque já usada por `cancelSaleAction`. Novo componente client `DeleteSaleButton`, modelado no `DeleteOsButton` já existente, ligado apenas na página de detalhe da venda.

**Tech Stack:** Next.js 16 (App Router, server actions), TypeScript, Supabase (Postgres + RLS), shadcn/ui (`AlertDialog`, `Button`), `sonner` (toast). Sem framework de testes automatizados no projeto — a verificação de cada tarefa é `npx tsc --noEmit` (typecheck) e, na última tarefa, um teste manual ponta-a-ponta pelo navegador.

## Global Constraints

- Sem restrição de `role`/permissão na exclusão — mesmo padrão do `deleteServiceOrderAction` existente.
- Disponível para venda em qualquer status (`concluida`, `pendente` ou `cancelada`).
- Botão aparece **somente** em `/vendas/[id]` (página de detalhe), não na listagem `/vendas`.
- `sale_items` e `payments` têm `ON DELETE CASCADE` em `sale_id` — não devem ser apagados manualmente, o banco cuida disso ao apagar a `sale`.
- Vendas antigas (sem `source_sale_id` no veículo) não têm o veículo removido automaticamente ao excluir — limitação de dado histórico aceita, não é bug.

---

### Task 1: Migration — coluna `source_sale_id` em `vehicles`

**Files:**
- Create: `supabase/migrations/20260706000001_add_source_sale_id_to_vehicles.sql`

**Interfaces:**
- Produces: coluna `vehicles.source_sale_id` (`uuid`, nullable, `REFERENCES sales(id) ON DELETE SET NULL`), consumida pela Task 2 (grava) e Task 3 (lê para decidir se apaga o veículo).

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- Rastreia qual venda originou um veículo criado automaticamente
-- (compra de scooter com cliente vinculado), para permitir limpeza
-- completa ao excluir a venda.
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS source_sale_id uuid REFERENCES sales(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Verificar sintaxe do SQL**

Run: `cat supabase/migrations/20260706000001_add_source_sale_id_to_vehicles.sql`
Expected: o conteúdo acima, sem erros de digitação (nome de tabela/coluna corretos: `vehicles`, `source_sale_id`, `sales`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260706000001_add_source_sale_id_to_vehicles.sql
git commit -m "feat: coluna source_sale_id em vehicles para rastrear venda de origem"
```

Nota: esta migration precisa ser aplicada no banco (mesmo processo manual usado para a migration anterior, `20260705000001`) antes do teste manual da Task 6. Ela não é aplicada automaticamente por este plano.

---

### Task 2: Gravar `source_sale_id` ao criar veículo em `confirmSaleAction`

**Files:**
- Modify: `lib/actions/sales.ts:106-123`

**Interfaces:**
- Consumes: `sale.id` (já disponível no escopo de `confirmSaleAction`, retornado pelo insert em `sales` feito antes deste bloco).
- Produces: linhas de `vehicles` com `source_sale_id` preenchido, consumidas pela Task 3.

- [ ] **Step 1: Adicionar o campo no insert de `vehicles`**

Em `lib/actions/sales.ts`, dentro do bloco `if (product?.product_type === "scooter") { ... }`, o insert atual é:

```ts
        await ctx.supabase.from("vehicles").insert({
          company_id: ctx.profile.company_id,
          customer_id: customerId,
          product_id: item.productId,
          type: "Scooter Elétrica",
          brand: product.brand ?? null,
          model: product.model ?? item.productName,
          serial_number: item.chassisNumber?.trim() || null,
          purchase_date: new Date().toISOString().split("T")[0],
          color: null,
          battery_type: null,
          voltage: null,
          power: null,
          autonomy: null,
          warranty_until: null,
          notes: null,
        })
```

Substituir por (adiciona só a linha `source_sale_id: sale.id,`):

```ts
        await ctx.supabase.from("vehicles").insert({
          company_id: ctx.profile.company_id,
          customer_id: customerId,
          product_id: item.productId,
          type: "Scooter Elétrica",
          brand: product.brand ?? null,
          model: product.model ?? item.productName,
          serial_number: item.chassisNumber?.trim() || null,
          purchase_date: new Date().toISOString().split("T")[0],
          color: null,
          battery_type: null,
          voltage: null,
          power: null,
          autonomy: null,
          warranty_until: null,
          notes: null,
          source_sale_id: sale.id,
        } as any)
```

Nota: o `as any` segue o mesmo padrão já usado no insert de `payments` neste arquivo (linha 171), necessário porque os tipos gerados de `types/database.ts` ainda não conhecem a coluna nova até serem regenerados — não é regenerado neste plano (fora de escopo).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/actions/sales.ts` (pode haver erros pré-existentes no projeto não relacionados a esta mudança — ignore-os, mas nenhum erro deve apontar para a linha do `source_sale_id`).

- [ ] **Step 3: Commit**

```bash
git add lib/actions/sales.ts
git commit -m "feat: grava source_sale_id ao criar veiculo a partir de venda"
```

---

### Task 3: Server action `deleteSaleAction` + helper compartilhado de reversão de estoque

**Files:**
- Modify: `lib/actions/sales.ts` (adiciona helper, refatora `cancelSaleAction`, adiciona `deleteSaleAction`)

**Interfaces:**
- Consumes: `getCtx()` (já existe no arquivo, retorna `{ supabase, user, profile } | null`), `ActionState` (tipo já importado no arquivo, de `./auth`).
- Produces: `export async function deleteSaleAction(id: string): Promise<ActionState>`, consumida pela Task 4 (`DeleteSaleButton`).

- [ ] **Step 1: Extrair helper `revertStockForItems` e refatorar `cancelSaleAction` para usá-lo**

Logo abaixo da função `confirmSaleAction` (antes de `export async function cancelSaleAction`), adicionar:

```ts
async function revertStockForItems(
  ctx: NonNullable<Awaited<ReturnType<typeof getCtx>>>,
  saleId: string,
  items: { product_id: string; quantity: number }[]
) {
  await Promise.all(items.map(async (item) => {
    const { data: product } = await ctx.supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .eq("company_id", ctx.profile.company_id)
      .single()

    if (!product) return

    const prev = product.stock_quantity
    const next = prev + item.quantity

    await ctx.supabase.from("stock_movements").insert({
      company_id: ctx.profile.company_id,
      product_id: item.product_id,
      type: "entrada",
      reason: "devolucao_cliente",
      quantity: item.quantity,
      previous_quantity: prev,
      new_quantity: next,
      reference_type: "sale",
      reference_id: saleId,
      user_id: ctx.user.id,
      notes: "Estorno por cancelamento de venda",
    })

    await ctx.supabase
      .from("products")
      .update({ stock_quantity: next })
      .eq("id", item.product_id)
      .eq("company_id", ctx.profile.company_id)
  }))
}
```

Depois, dentro de `cancelSaleAction`, substituir o bloco atual:

```ts
  // Reverte a baixa de estoque de cada item da venda
  await Promise.all((items ?? []).map(async (item) => {
    const { data: product } = await ctx.supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .eq("company_id", ctx.profile.company_id)
      .single()

    if (!product) return

    const prev = product.stock_quantity
    const next = prev + item.quantity

    await ctx.supabase.from("stock_movements").insert({
      company_id: ctx.profile.company_id,
      product_id: item.product_id,
      type: "entrada",
      reason: "devolucao_cliente",
      quantity: item.quantity,
      previous_quantity: prev,
      new_quantity: next,
      reference_type: "sale",
      reference_id: id,
      user_id: ctx.user.id,
      notes: "Estorno por cancelamento de venda",
    })

    await ctx.supabase
      .from("products")
      .update({ stock_quantity: next })
      .eq("id", item.product_id)
      .eq("company_id", ctx.profile.company_id)
  }))
```

por:

```ts
  // Reverte a baixa de estoque de cada item da venda
  await revertStockForItems(ctx, id, items ?? [])
```

- [ ] **Step 2: Typecheck após o refactor**

Run: `npx tsc --noEmit`
Expected: sem erros novos — `cancelSaleAction` deve continuar com o mesmo comportamento, só chamando o helper.

- [ ] **Step 3: Adicionar `deleteSaleAction` ao final do arquivo**

```ts
export async function deleteSaleAction(id: string): Promise<ActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { data: sale } = await ctx.supabase
    .from("sales")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)
    .single()

  if (!sale) return { error: "Venda não encontrada" }

  const { data: items } = await ctx.supabase
    .from("sale_items")
    .select("product_id, quantity")
    .eq("sale_id", id)
    .eq("company_id", ctx.profile.company_id)

  if (sale.status !== "cancelada") {
    await revertStockForItems(ctx, id, items ?? [])
  }

  await ctx.supabase
    .from("cash_movements")
    .delete()
    .eq("source_type", "sale")
    .eq("source_id", id)
    .eq("company_id", ctx.profile.company_id)

  await ctx.supabase
    .from("stock_movements")
    .delete()
    .eq("reference_type", "sale")
    .eq("reference_id", id)
    .eq("company_id", ctx.profile.company_id)

  const { data: vehicles } = await ctx.supabase
    .from("vehicles")
    .select("id")
    .eq("source_sale_id", id)
    .eq("company_id", ctx.profile.company_id)

  await Promise.all((vehicles ?? []).map(async (vehicle) => {
    const { count } = await ctx.supabase
      .from("service_orders")
      .select("*", { count: "exact", head: true })
      .eq("vehicle_id", vehicle.id)
      .eq("company_id", ctx.profile.company_id)

    if (!count) {
      await ctx.supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id)
        .eq("company_id", ctx.profile.company_id)
    }
  }))

  const { error } = await ctx.supabase
    .from("sales")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.profile.company_id)

  if (error) return { error: "Erro ao excluir venda" }

  revalidatePath("/vendas")
  revalidatePath("/produtos")
  revalidatePath("/estoque")
  revalidatePath("/dashboard")
  revalidatePath("/relatorios")
  return { success: "Venda excluída" }
}
```

Nota: a query em `vehicles` por `source_sale_id` e o `.eq("source_sale_id", id)` vão exigir `as any` no `.select`/`.eq` só se o typecheck do Step 4 reclamar dos tipos gerados desatualizados (mesmo motivo da Task 2); adicione `as any` no retorno do `.select("id")` (ex.: `.select("id") as any`) apenas se necessário.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros. Se houver erro de tipo por causa de `source_sale_id` não existir em `types/database.ts`, adicionar `as any` conforme a nota acima e rodar de novo.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/sales.ts
git commit -m "feat: acao deleteSaleAction com reversao de estoque/caixa/veiculo"
```

---

### Task 4: Componente `DeleteSaleButton`

**Files:**
- Create: `components/sales/delete-sale-button.tsx`

**Interfaces:**
- Consumes: `deleteSaleAction(id: string): Promise<ActionState>` da Task 3 (`ActionState` é `{ error?: string; success?: string }`, mesmo formato usado por `CancelSaleButton`).
- Produces: `export function DeleteSaleButton({ id }: { id: string })`, consumido pela Task 5.

- [ ] **Step 1: Criar o componente**

```tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteSaleAction } from "@/lib/actions/sales"
import { Trash2 } from "lucide-react"

export function DeleteSaleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSaleAction(id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(result.success ?? "Venda excluída")
        router.push("/vendas")
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O estoque será revertido, os pagamentos e o
            lançamento no caixa desta venda serão removidos e, se um veículo foi criado
            automaticamente por ela (e ainda não tiver nenhuma OS vinculada), também será excluído.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros em `components/sales/delete-sale-button.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/sales/delete-sale-button.tsx
git commit -m "feat: componente DeleteSaleButton"
```

---

### Task 5: Ligar o botão em `/vendas/[id]`

**Files:**
- Modify: `app/(app)/vendas/[id]/page.tsx`

**Interfaces:**
- Consumes: `DeleteSaleButton` da Task 4.

- [ ] **Step 1: Importar o componente**

Adicionar junto aos outros imports de `components/sales/*` (perto da linha 11):

```ts
import { DeleteSaleButton } from "@/components/sales/delete-sale-button"
```

- [ ] **Step 2: Renderizar o botão ao lado do `CancelSaleButton`**

Trecho atual (linha 107):

```tsx
          {sale.status !== "cancelada" && <CancelSaleButton id={id} />}
```

Substituir por (adiciona o novo botão logo depois, sem condição de status):

```tsx
          {sale.status !== "cancelada" && <CancelSaleButton id={id} />}
          <DeleteSaleButton id={id} />
```

- [ ] **Step 3: Typecheck e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: ambos sem erros novos relacionados a `app/(app)/vendas/[id]/page.tsx` ou aos arquivos das tasks anteriores.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/vendas/[id]/page.tsx"
git commit -m "feat: exibe botao excluir venda no detalhe da venda"
```

---

### Task 6: Aplicar migration e teste manual ponta-a-ponta

**Files:** nenhum arquivo novo — apenas execução e verificação manual.

- [ ] **Step 1: Aplicar a migration da Task 1 no banco**

Mesmo processo usado para a migration anterior (`20260705000001`) — aplicar `supabase/migrations/20260706000001_add_source_sale_id_to_vehicles.sql` no projeto Supabase vinculado.

- [ ] **Step 2: Subir o servidor de dev**

Run: `npm run dev`

- [ ] **Step 3: Criar venda de teste com veículo**

No PDV (`/vendas/nova`), lançar uma venda com um produto do tipo scooter vinculado a um cliente (para gerar veículo automaticamente) e um produto comum, confirmando pagamento. Confirme que:
- O estoque dos dois produtos baixou.
- Foi criado um registro em `vehicles` para o cliente.

- [ ] **Step 4: Excluir a venda sem cancelar antes**

Abrir `/vendas/[id]` da venda criada, clicar em "Excluir venda" (ícone de lixeira), confirmar no diálogo. Confirme que:
- Toast de sucesso "Venda excluída".
- Redirecionado para `/vendas` e a venda não aparece mais na lista.
- Estoque dos produtos voltou ao valor anterior à venda.
- O veículo criado não aparece mais em `/clientes/[id]` (ou onde os veículos do cliente são listados).
- Se havia caixa aberto, o lançamento dessa venda sumiu do caixa (`/caixa`).

- [ ] **Step 5: Repetir cancelando antes de excluir**

Criar outra venda (sem scooter, para simplificar), cancelar ("Cancelar venda"), conferir que o estoque voltou. Em seguida clicar em "Excluir venda" e confirmar. Verificar que o estoque **não** é incrementado uma segunda vez (ficaria maior que o valor original se houvesse duplicação).

- [ ] **Step 6: Repetir com OS vinculada ao veículo**

Criar uma venda de scooter com cliente (gera veículo), depois criar uma Ordem de Serviço para esse veículo em `/oficina`. Voltar na venda e excluir. Confirme que:
- A venda é excluída normalmente.
- O veículo **permanece** existindo (porque tem uma OS vinculada) e a OS continua acessível normalmente.

- [ ] **Step 7: Confirmar que nada mais quebrou**

Navegar por `/vendas`, `/dashboard`, `/relatorios`, `/estoque` e `/caixa` para conferir que os números batem e nenhuma página quebrou após as exclusões dos passos anteriores.

Nenhum commit nesta task — é só verificação. Se algum passo falhar, volte à task correspondente, corrija, e repita o passo do teste manual a partir de onde falhou.
