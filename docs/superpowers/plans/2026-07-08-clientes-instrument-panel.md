# Clientes — Painel de Instrumentos v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o vocabulário visual do painel de instrumentos (já usado no Dashboard) nas duas telas mais usadas do módulo Clientes — lista (`/clientes`) e detalhe (`/clientes/[id]`) — trocando `MetricCard`/cards com cor Tailwind hardcoded por `KpiTile`, badge de prioridade hardcoded por `StatusPill`, e o array de 8 cores de avatar por rotação das 4 cores de marca já tokenizadas.

**Architecture:** Reaproveita `KpiTile` (`components/dashboard/kpi-tile.tsx`) e `StatusPill` (`components/shared/status-pill.tsx`) já existentes — nenhum componente novo é criado nesta rodada. `priorityZone`/`priorityLabel`, hoje locais em `dashboard/page.tsx`, são extraídas pra `lib/constants.ts` porque a página de detalhe do cliente passa a precisar da mesma lógica.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 (inalterado).

## Global Constraints

- Zero cor hardcoded em componente — só design tokens (`var(--...)` ou classes Tailwind que resolvem token). Confirmado em `docs/superpowers/plans/2026-07-08-teal-ink-instrument-panel.md`.
- Contraste ≥ 4.5:1 nos dois temas — avatares usam as variantes `-dim` das cores de marca (`bg-brand-teal-dim` etc.), que são as variantes "text-safe pra fundo com texto branco" documentadas em `app/globals.css:105-109`.
- Nunca só cor pra transmitir estado — `StatusPill` sempre acompanha ícone + texto (já garantido pelo componente).
- Não existe suíte de testes automatizada no projeto — verificação por task é `npx tsc --noEmit` (+ `npm run build` na task final); verificação visual manual fica registrada como pendência de conferência humana.
- Escopo desta rodada: só `app/(app)/clientes/page.tsx`, `app/(app)/clientes/[id]/page.tsx` e `lib/constants.ts`/`app/(app)/dashboard/page.tsx` (só pra extrair o helper). `/clientes/novo` e `/clientes/[id]/editar` ficam de fora.
- Commits em português, seguindo o padrão do repo.
- Spec de referência: `docs/superpowers/specs/2026-07-08-clientes-instrument-panel-design.md`.

---

### Task 1: Extrair `priorityZone`/`priorityLabel` para `lib/constants.ts`

**Files:**
- Modify: `lib/constants.ts`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Produces: `priorityZone(priority: string): "optimal" | "warning" | "critical"` e `priorityLabel(priority: string): string`, exportadas de `@/lib/constants`.
- Consumido por: Task 3 (`app/(app)/clientes/[id]/page.tsx`) e pelo `dashboard/page.tsx` já existente (que passa a importar em vez de definir localmente).

- [ ] **Step 1: Adicionar as duas funções em `lib/constants.ts`**

Em `lib/constants.ts`, logo depois do bloco `OS_PRIORITY_COLORS` (linhas 57-62 atuais):

```ts
export const OS_PRIORITY_COLORS: Record<string, string> = {
  baixa: "bg-slate-100 text-slate-700",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
}
```

adicionar:

```ts

export function priorityZone(priority: string): "optimal" | "warning" | "critical" {
  if (priority === "urgente") return "critical"
  if (priority === "alta") return "warning"
  return "optimal"
}

export function priorityLabel(priority: string): string {
  if (priority === "urgente") return "Urgente"
  if (priority === "alta") return "Alta"
  if (priority === "baixa") return "Baixa"
  return "Normal"
}
```

- [ ] **Step 2: Remover as duas funções locais de `app/(app)/dashboard/page.tsx` e importar de `lib/constants`**

Em `app/(app)/dashboard/page.tsx`, remover este bloco (linhas 56-66 atuais):

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

E adicionar o import — o arquivo hoje não importa nada de `@/lib/constants`, então adicionar esta linha nova junto aos outros imports locais (logo abaixo de `import { bucketByDay } from "@/lib/dashboard-charts"`):

```tsx
import { priorityZone, priorityLabel } from "@/lib/constants"
```

O uso em JSX (`<StatusPill zone={priorityZone(os.priority)} label={priorityLabel(os.priority)} />`) não muda — só a origem das duas funções.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add lib/constants.ts "app/(app)/dashboard/page.tsx"
git commit -m "refactor: extrai priorityZone/priorityLabel pra lib/constants (reuso em Clientes)"
```

---

### Task 2: Lista de clientes — `KpiTile`, avatares de marca e hover consistente

**Files:**
- Modify: `app/(app)/clientes/page.tsx`

**Interfaces:**
- Consumes: `KpiTile` (`components/dashboard/kpi-tile.tsx`, já existe — `KpiTile({ title, numericValue, format?, icon, href?, sparkline?, size?, className? })`).

- [ ] **Step 1: Trocar o import de `MetricCard` pelo de `KpiTile`**

Em `app/(app)/clientes/page.tsx`, trocar:

```tsx
import { MetricCard } from "@/components/shared/metric-card"
```

por:

```tsx
import { KpiTile } from "@/components/dashboard/kpi-tile"
```

- [ ] **Step 2: Substituir os 3 `MetricCard` por `KpiTile`**

O bloco atual (linhas 137-160 aprox.):

```tsx
      {/* Metric summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total de clientes"
          value={String(totalCount ?? 0)}
          icon={Users}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <MetricCard
          title="Novos este mês"
          value={String(newThisMonth ?? 0)}
          icon={UserCheck}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
        <MetricCard
          title="Com scooter"
          value={String(withVehicles ?? 0)}
          icon={Bike}
          colorClass="text-violet-600 dark:text-violet-400"
          bgClass="bg-violet-500/10"
        />
      </div>
```

Trocar por:

```tsx
      {/* Metric summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile title="Total de clientes" numericValue={totalCount ?? 0} icon={<Users />} />
        <KpiTile title="Novos este mês" numericValue={newThisMonth ?? 0} icon={<UserCheck />} />
        <KpiTile title="Com scooter" numericValue={withVehicles ?? 0} icon={<Bike />} />
      </div>
```

(`Users`, `UserCheck`, `Bike` já são importados de `lucide-react` no topo do arquivo — nenhum import novo de ícone necessário.)

- [ ] **Step 3: Trocar a paleta de cores dos avatares**

O array atual (linhas 31-40):

```tsx
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
]
```

Trocar por (4 cores de marca, variante `-dim` — text-safe pra texto branco em cima, ver `app/globals.css:105-109`):

```tsx
const AVATAR_COLORS = [
  "bg-brand-teal-dim",
  "bg-brand-violet-dim",
  "bg-brand-amber-dim",
  "bg-brand-coral-dim",
]
```

A função `avatarColor(name)` logo abaixo não muda.

- [ ] **Step 4: Atualizar o hover do card de cada cliente**

No `<Card>` dentro do `.map((c) => ...)` (linha 188 atual):

```tsx
                  <Card className="group hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-pointer border-border/60">
```

Trocar por:

```tsx
                  <Card className="group border-border/60 transition-all duration-200 hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 cursor-pointer">
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/clientes/page.tsx"
git commit -m "feat: lista de clientes adota KpiTile e paleta de marca (painel de instrumentos)"
```

---

### Task 3: Detalhe do cliente — `KpiTile`, avatar de marca e `StatusPill` na prioridade

**Files:**
- Modify: `app/(app)/clientes/[id]/page.tsx`

**Interfaces:**
- Consumes: `KpiTile` (Task 2's import, mesmo componente), `StatusPill` (`components/shared/status-pill.tsx`, `StatusPill({ zone, label, icon?, className? })`), `priorityZone`/`priorityLabel` (Task 1, de `@/lib/constants`).

- [ ] **Step 1: Adicionar os imports novos e remover os que saem de uso**

No topo de `app/(app)/clientes/[id]/page.tsx`, trocar:

```tsx
import { Pencil, Plus, Phone, Mail, MapPin, FileText, Bike, Wrench, DollarSign, CalendarDays, MessageCircle } from "lucide-react"
import { VehiclesSection } from "@/components/customers/vehicles-section"
import { ClienteDetalheExportButton } from "@/components/customers/cliente-detalhe-export-button"
import { OS_PRIORITY_LABELS, OS_PRIORITY_COLORS } from "@/lib/constants"
```

por:

```tsx
import { Pencil, Plus, Phone, Mail, MapPin, FileText, Bike, Wrench, DollarSign, CalendarDays, MessageCircle } from "lucide-react"
import { VehiclesSection } from "@/components/customers/vehicles-section"
import { ClienteDetalheExportButton } from "@/components/customers/cliente-detalhe-export-button"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { StatusPill } from "@/components/shared/status-pill"
import { priorityZone, priorityLabel } from "@/lib/constants"
```

(`OS_PRIORITY_LABELS`/`OS_PRIORITY_COLORS` são removidos do import — confirmado via grep que só são usados no bloco de prioridade do Step 4 abaixo, que deixa de existir nesta forma.)

- [ ] **Step 2: Trocar a paleta de cores do avatar grande**

O array atual (linhas 34-43):

```tsx
const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
]
```

Trocar por:

```tsx
const AVATAR_COLORS = [
  "from-brand-teal to-brand-teal-dim",
  "from-brand-violet to-brand-violet-dim",
  "from-brand-amber to-brand-amber-dim",
  "from-brand-coral to-brand-coral-dim",
]
```

A função `avatarColor(name)` logo abaixo não muda.

- [ ] **Step 3: Substituir os 4 stat cards por `KpiTile`**

O bloco atual "Stats row" (linhas 143-196 aprox., os 4 `<Card>` com ícone em caixa colorida) é substituído inteiro por:

```tsx
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile title="Total gasto" numericValue={totalGasto} format="currency" icon={<DollarSign />} />
        <KpiTile title="Total de OS" numericValue={serviceOrders?.length ?? 0} icon={<Wrench />} />
        <KpiTile title="OS em aberto" numericValue={osAbertasCount} icon={<Wrench />} />
        <KpiTile title="Scooters" numericValue={vehicles?.length ?? 0} icon={<Bike />} />
      </div>
```

- [ ] **Step 4: Trocar o badge de prioridade hardcoded por `StatusPill`**

No histórico de OS (dentro de `serviceOrders.map((os: any) => ...)`), o trecho atual:

```tsx
                          {os.priority && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-md ${OS_PRIORITY_COLORS[os.priority] ?? ""}`}>
                              {OS_PRIORITY_LABELS[os.priority]}
                            </span>
                          )}
```

Trocar por (mesma regra do Dashboard: só aparece em urgente/alta):

```tsx
                          {(os.priority === "urgente" || os.priority === "alta") && (
                            <StatusPill zone={priorityZone(os.priority)} label={priorityLabel(os.priority)} />
                          )}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/clientes/[id]/page.tsx"
git commit -m "feat: detalhe do cliente adota KpiTile, avatar de marca e StatusPill (painel de instrumentos)"
```

---

### Task 4: Verificação

**Files:** nenhum (só verificação).

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 2: Verificação visual manual (registrar limitação)**

Este ambiente não tem browser headless configurado nem sessão autenticada disponível pra Supabase — mesma limitação já documentada nas rodadas anteriores do painel de instrumentos. Escrever um relatório em `.superpowers/sdd/task-4-report.md` (módulo Clientes) listando o checklist que precisa de conferência humana:
- Lista de clientes: 3 `KpiTile` com glow teal no hover e número em `font-mono`; avatares nas 4 cores de marca (`-dim`), texto branco legível nos dois temas; hover do card do cliente com glow teal igual ao dashboard.
- Detalhe do cliente: 4 `KpiTile` no lugar dos stat cards antigos ("Total gasto" formatado em R$); avatar grande com gradiente de marca; `StatusPill` aparece só em OS urgente/alta no histórico, com ícone + texto; badge de status da empresa (cor do banco) continua igual, sem regressão.
- Contraste do texto branco nas iniciais dos avatares ≥ 4.5:1 nos dois temas (light/dark).
- Nenhuma regressão em `/clientes/novo` e `/clientes/[id]/editar` (fora de escopo, não devem ter sido tocados).

- [ ] **Step 3: Commit final (se algum ajuste for necessário)**

```bash
git add -A
git commit -m "fix: ajustes de verificacao do painel de instrumentos em Clientes"
```

(Só necessário se algo precisar de correção.)
