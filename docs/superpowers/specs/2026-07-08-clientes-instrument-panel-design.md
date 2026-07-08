# Clientes — Design Spec (Painel de Instrumentos v2)

**Goal:** Aplicar o vocabulário visual criado para o Dashboard (`docs/superpowers/plans/2026-07-08-teal-ink-instrument-panel.md`) nas duas telas mais usadas do módulo Clientes — lista (`/clientes`) e detalhe (`/clientes/[id]`) — trocando componentes com cor Tailwind hardcoded por `KpiTile`, `StatusPill` e a paleta de 4 cores de marca (teal/violeta/âmbar/coral) já registrada em `app/globals.css`.

**Escopo:** Só `app/(app)/clientes/page.tsx` e `app/(app)/clientes/[id]/page.tsx`, mais a extração de um helper compartilhado pra `lib/constants.ts`. `/clientes/novo` e `/clientes/[id]/editar` ficam fora desta rodada (documentado como próxima rodada abaixo).

**Tech stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4, reaproveitando `KpiTile` (`components/dashboard/kpi-tile.tsx`) e `StatusPill` (`components/shared/status-pill.tsx`) já existentes — nenhum componente novo é criado.

---

## 1. Lista de clientes (`app/(app)/clientes/page.tsx`)

### 1.1 Cards de métrica do topo

Os 3 `MetricCard` (Total de clientes / Novos este mês / Com scooter) são substituídos por `KpiTile`:

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
  <KpiTile title="Total de clientes" numericValue={totalCount ?? 0} icon={<Users />} />
  <KpiTile title="Novos este mês" numericValue={newThisMonth ?? 0} icon={<UserCheck />} />
  <KpiTile title="Com scooter" numericValue={withVehicles ?? 0} icon={<Bike />} />
</div>
```

- Sem `href` (as métricas descrevem a própria página, não linkam pra outro lugar).
- Sem `sparkline` (não há query de série histórica nesta página; adicionar uma só pra isso seria escopo extra não pedido).
- `KpiTile` já anima o número (`useCountUp`) e usa `font-mono` — comportamento herdado de graça.
- Remove o import de `MetricCard`; adiciona `import { KpiTile } from "@/components/dashboard/kpi-tile"`.

### 1.2 Avatar de iniciais (lista)

Troca o array `AVATAR_COLORS` (8 cores Tailwind: blue/violet/emerald/amber/rose/cyan/indigo/teal) por 4 cores de marca, usando as variantes `-dim` — são as variantes "text-safe pra fundo com texto branco" documentadas em `app/globals.css:105-109` (garante contraste ≥4.5:1 do texto branco das iniciais nos dois temas):

```tsx
const AVATAR_COLORS = [
  "bg-brand-teal-dim",
  "bg-brand-violet-dim",
  "bg-brand-amber-dim",
  "bg-brand-coral-dim",
]
```

A função `avatarColor(name)` (hash simples de char codes → índice do array) não muda — só o array de origem.

### 1.3 Hover do card de cliente

O `<Card>` de cada cliente na grade troca:

```tsx
className="group hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-pointer border-border/60"
```

por (mesmo padrão dos cards do dashboard):

```tsx
className="group border-border/60 transition-all duration-200 hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 cursor-pointer"
```

### 1.4 Sem mudanças

`SearchInput`, `Pagination`, `EmptyState`, `ClientesExportButton`, badge de contagem de veículos (`Badge variant="secondary"`) — já são token-driven, ficam como estão.

---

## 2. Detalhe do cliente (`app/(app)/clientes/[id]/page.tsx`)

### 2.1 Stat cards (linha "Total gasto / Total de OS / OS em aberto / Scooters")

Os 4 `<Card>` com ícone em caixa de cor hardcoded (`bg-primary/10`, `bg-violet-500/10`, `bg-amber-500/10`, `bg-emerald-500/10`) são substituídos por `KpiTile`:

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <KpiTile title="Total gasto" numericValue={totalGasto} format="currency" icon={<DollarSign />} />
  <KpiTile title="Total de OS" numericValue={serviceOrders?.length ?? 0} icon={<Wrench />} />
  <KpiTile title="OS em aberto" numericValue={osAbertasCount} icon={<Wrench />} />
  <KpiTile title="Scooters" numericValue={vehicles?.length ?? 0} icon={<Bike />} />
</div>
```

- `format="currency"` só no "Total gasto" (`KpiTile` já formata em `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`, igual ao `fmt()` local do arquivo — sem duplicar formatação).
- Remove os blocos `<Card><CardContent>` manuais e o import de ícones específicos de cor não é mais necessário para esse trecho (mantém os imports usados em outras partes da página).

### 2.2 Avatar grande do header

Troca `AVATAR_COLORS` (gradientes `from-X-500 to-X-600` hardcoded) por gradiente com tokens de marca:

```tsx
const AVATAR_COLORS = [
  "from-brand-teal to-brand-teal-dim",
  "from-brand-violet to-brand-violet-dim",
  "from-brand-amber to-brand-amber-dim",
  "from-brand-coral to-brand-coral-dim",
]
```

Mesma função `avatarColor(name)`, só troca o array. Mantém `bg-gradient-to-br ... text-white`.

### 2.3 Prioridade no histórico de OS → `StatusPill`

No item de cada OS do histórico (`serviceOrders.map(...)`), a prioridade hoje usa `OS_PRIORITY_COLORS` (cor Tailwind hardcoded, mostrada sempre). Troca pela mesma regra do Dashboard: `StatusPill` só aparece quando a prioridade é `urgente` ou `alta`; `normal`/`baixa` não mostram nada extra.

```tsx
{(os.priority === "urgente" || os.priority === "alta") && (
  <StatusPill zone={priorityZone(os.priority)} label={priorityLabel(os.priority)} />
)}
```

Remove o `<span className={OS_PRIORITY_COLORS[...]}>` inteiro. `OS_PRIORITY_LABELS` e `OS_PRIORITY_COLORS` só são usados ali (confirmado via grep — únicas ocorrências no arquivo fora do import), então o import inteiro `import { OS_PRIORITY_LABELS, OS_PRIORITY_COLORS } from "@/lib/constants"` é removido.

O badge de status (`service_order_statuses.color`, span com `style={{ backgroundColor: ... }}`) **não muda** — é uma cor dinâmica definida por empresa (status configurável), não faz parte do sistema fixo de zona.

### 2.4 Sem mudanças

Contact card (telefone/WhatsApp/e-mail/endereço/CPF), `VehiclesSection`, botão WhatsApp (verde é a cor de marca do WhatsApp, não uma cor "acidental" a corrigir), `ClienteDetalheExportButton`.

---

## 3. Helper compartilhado: `priorityZone` / `priorityLabel`

Hoje essas duas funções existem só dentro de `app/(app)/dashboard/page.tsx` (linhas 56-65 aprox.):

```tsx
function priorityZone(priority: string): "optimal" | "warning" | "critical" {
  if (priority === "urgente") return "critical"
  if (priority === "alta") return "warning"
  return "optimal"
}
function priorityLabel(priority: string): string {
  if (priority === "urgente") return "Urgente"
  if (priority === "alta") return "Alta"
  if (priority === "baixa") return "Baixa"
  return "Normal"
}
```

Como a página de detalhe do cliente agora precisa da mesma lógica, extraio as duas para `lib/constants.ts` (perto de `OS_PRIORITY_LABELS`/`OS_PRIORITY_COLORS`, mesmo domínio) e importo nos dois arquivos, em vez de duplicar. `dashboard/page.tsx` perde as duas funções locais e ganha o import; `OS_PRIORITY_COLORS` continua em `lib/constants.ts` para quem ainda usa (Vendas/Oficina/Orçamentos/Garantias, fora de escopo desta rodada).

---

## 4. Verificação

- `npx tsc --noEmit` — sem erros.
- `npm run build` — sem erros.
- Conferência visual manual (mesma limitação de ambiente das rodadas anteriores — sem browser headless autenticado):
  - Lista: 3 KpiTiles com glow teal no hover, número em `font-mono`; avatares nas 4 cores de marca (`-dim`), texto branco legível; hover do card do cliente com glow teal igual ao dashboard.
  - Detalhe: 4 KpiTiles no lugar dos stat cards antigos; avatar grande com gradiente de marca; `StatusPill` só aparece em OS urgente/alta no histórico; badge de status da empresa (cor do banco) continua igual.
  - `prefers-reduced-motion`: `KpiTile`/`useCountUp` já respeita (herdado, sem mudança de comportamento aqui).
  - Contraste do texto branco nas iniciais dos avatares ≥ 4.5:1 nos dois temas (validado pelo uso das variantes `-dim`, já documentadas como "text-safe" no CSS).

---

## Próxima rodada (fora de escopo deste spec)

- `/clientes/novo` e `/clientes/[id]/editar`.
- Migrar `OS_PRIORITY_COLORS`/badges hardcoded em Vendas, Oficina, Orçamentos, Garantias pro `StatusPill` (já documentado no plano do Dashboard).
- Unificar os demais usos de `MetricCard` no resto do app (fora do módulo Clientes) em cima do `KpiTile`.
