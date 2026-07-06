# Excluir venda

## Contexto

Hoje a página `/vendas/[id]` tem um botão "Cancelar venda"
(`components/sales/cancel-sale-button.tsx` + `cancelSaleAction` em
`lib/actions/sales.ts`) que reverte o estoque dos itens e marca a venda
como `status = 'cancelada'`, mantendo o registro no histórico.

Não existe hoje nenhuma forma de apagar uma venda do banco. Quando o
cliente cancela a compra depois que a baixa de estoque (e eventual
pagamento/lançamento de caixa) já foi feita, a loja quer poder remover a
venda por completo, não só marcá-la como cancelada.

## Problema

Adicionar uma opção de exclusão definitiva de venda, que desfaça todos os
efeitos colaterais que a venda gerou (estoque, pagamentos, lançamento de
caixa e, quando aplicável, o veículo criado automaticamente a partir de
uma venda de scooter).

## Solução

### A) Nova coluna `vehicles.source_sale_id`

A tabela `vehicles` não guarda hoje nenhuma referência de qual venda a
originou. Sem isso, não é possível saber com segurança "esse veículo foi
criado por essa venda" no momento de excluir.

Migration nova:

```sql
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS source_sale_id uuid REFERENCES sales(id) ON DELETE SET NULL;
```

Mesmo padrão já usado em `revision_schedules.source_sale_id`
(`supabase/migrations/20260618000001_revision_reminders.sql`).

Em `confirmSaleAction` (`lib/actions/sales.ts`), no bloco que cria o
veículo automaticamente para item de scooter com cliente (linhas
~105-123), incluir `source_sale_id: sale.id` no insert.

Vendas antigas (já existentes) não terão esse vínculo retroativo — ao
excluir uma venda antiga que gerou veículo, o veículo simplesmente não
será removido automaticamente (comportamento aceitável, é uma limitação
de dados históricos, não um bug).

### B) Nova ação `deleteSaleAction(id)` em `lib/actions/sales.ts`

Passos, em ordem:

1. Autentica (`getCtx()`), busca a venda por `id` + `company_id`. Se não
   existir, retorna erro.
2. Busca `sale_items` (product_id, quantity) da venda.
3. **Reversão de estoque condicional**: se `sale.status !== 'cancelada'`,
   reverte o estoque de cada item (mesma lógica de
   `cancelSaleAction`: soma `quantity` de volta em
   `products.stock_quantity`). Se a venda já estava cancelada, o estoque
   já foi revertido antes — não reverte de novo.
4. Apaga todas as linhas de `cash_movements` onde
   `source_type = 'sale' AND source_id = id AND company_id = cid` —
   remove o lançamento do caixa gerado por essa venda (existente
   independente do status atual do caixa, aberto ou fechado).
5. Apaga todas as linhas de `stock_movements` onde
   `reference_type = 'sale' AND reference_id = id AND company_id = cid` —
   limpa o histórico de movimentação de estoque dessa venda (tanto a
   saída original quanto o eventual estorno de cancelamento).
6. Busca veículo(s) com `source_sale_id = id`. Para cada um, verifica se
   existe alguma `service_orders` com `vehicle_id` = esse veículo. Se
   **não** houver nenhuma OS vinculada, apaga o veículo. Se houver,
   deixa o veículo intacto (ao apagar a venda depois, o
   `ON DELETE SET NULL` da FK zera `source_sale_id` automaticamente).
7. Apaga a venda (`sales.delete()`). `sale_items` e `payments` têm
   `ON DELETE CASCADE` para `sale_id`, então são removidos junto pelo
   banco — não precisa apagar manualmente.
8. Em caso de erro em qualquer passo de escrita, retorna
   `{ error: "..." }` (sem rollback transacional — mesmo padrão de
   tratamento de erro já usado em `confirmSaleAction`/`cancelSaleAction`
   neste arquivo, que também não usa transações).
9. `revalidatePath` em `/vendas`, `/produtos`, `/estoque`, `/dashboard`,
   `/relatorios`.
10. Retorna `{ success: "Venda excluída" }`.

Sem restrição por `role` — disponível para qualquer usuário autenticado
da empresa, mesmo padrão do `deleteServiceOrderAction` existente (que
também não restringe por role). Diferente do `deleteServiceOrderAction`,
esta ação **não bloqueia exclusão quando já há pagamento/baixa
registrada** — é justamente o caso principal que a funcionalidade
resolve.

Disponível para venda em qualquer status (`concluida`, `pendente` ou já
`cancelada`).

### C) UI: `components/sales/delete-sale-button.tsx`

Novo componente, mesmo padrão visual/estrutural do
`components/service-orders/delete-os-button.tsx`: botão outline com
ícone `Trash2` (`lucide-react`), `AlertDialog` de confirmação com texto
avisando que a ação é irreversível e reverte estoque/caixa e pode
remover o veículo vinculado, chama `deleteSaleAction(id)` via
`useTransition`, mostra toast de sucesso/erro (`sonner`), e em caso de
sucesso redireciona para `/vendas` (`useRouter().push`).

Colocado em `app/(app)/vendas/[id]/page.tsx`, ao lado do
`CancelSaleButton` existente — **somente na página de detalhe da
venda**, não na listagem (`/vendas`).

## Fora de escopo

- Botão de excluir na listagem `/vendas` — só no detalhe.
- Restrição por role/permissão.
- Transação atômica no banco (segue o padrão já existente no arquivo,
  sem transações).
- Alterar o comportamento do `cancelSaleAction`/"Cancelar venda"
  existente — continua igual, como alternativa mais branda.
- Backfill de `source_sale_id` para veículos de vendas antigas.

## Arquivos afetados

- `supabase/migrations/<nova>_add_source_sale_id_to_vehicles.sql` (nova)
- `lib/actions/sales.ts` — `confirmSaleAction` (grava `source_sale_id`),
  nova `deleteSaleAction`
- `components/sales/delete-sale-button.tsx` (novo)
- `app/(app)/vendas/[id]/page.tsx` — adiciona o botão

## Teste

1. Fazer uma venda no PDV incluindo um produto tipo scooter vinculado a
   um cliente (gera veículo automaticamente) e um produto comum,
   confirmando o pagamento (gera `payments` + `cash_movements` se houver
   caixa aberto).
2. Conferir que o estoque baixou e o veículo foi criado com
   `source_sale_id` preenchido.
3. Abrir o detalhe da venda e clicar em "Excluir venda" (sem cancelar
   antes). Confirmar no diálogo.
4. Verificar: estoque dos produtos voltou ao valor anterior; venda some
   de `/vendas`; veículo foi removido (pois não tinha OS); lançamento de
   caixa correspondente sumiu do caixa aberto.
5. Repetir o teste cancelando a venda primeiro ("Cancelar venda"),
   depois excluindo — conferir que o estoque não é revertido em
   duplicidade.
6. Repetir criando uma OS para o veículo gerado pela venda antes de
   excluir — conferir que a venda é excluída mas o veículo permanece
   (com `source_sale_id` nulo).
