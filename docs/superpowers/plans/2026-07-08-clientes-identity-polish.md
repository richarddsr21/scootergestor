# Clientes — Identidade por Cliente (polish visual) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a cada cliente uma "cor de identidade" (a cor do avatar, já existente) que o acompanha em todos os lugares onde ele aparece — avatar, glow do hover do card, acento de borda, ícone dos veículos — e padronizar ícones soltos em ícone-em-caixa (`bg-muted`), consolidando a lógica hoje duplicada entre a lista e o detalhe de clientes num módulo compartilhado `lib/avatar.ts`.

**Architecture:** Reaproveita tokens de marca já existentes (`--brand-teal/-violet/-amber/-coral`, `--avatar-teal/-violet/-amber/-coral`) — só adiciona 3 tokens de glow decorativo novos. Nenhum componente novo; consolida lógica duplicada num módulo `lib/avatar.ts` que ambas as páginas de Clientes passam a importar.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 (inalterado).

## Global Constraints

- Zero cor hardcoded em componente — só design tokens.
- Tailwind v4 é JIT baseado em busca textual no código-fonte: qualquer classe usada precisa aparecer como **string literal completa** em algum arquivo — nunca montar uma classe por concatenação de prefixo+variável em runtime (ex.: `` `hover:border-${cor}` ``). Os mapas `Record<AvatarColor, string>` deste plano usam sempre strings completas por chave.
- Cores de marca (`--brand-*`) usadas como ícone/borda/sombra decorativa só precisam de 3:1 contra o fundo (WCAG 1.4.11, não 4.5:1 de texto) — é o mesmo padrão já usado pelo ícone teal do `KpiTile` contra `bg-card`, já revisado e aprovado em rodadas anteriores. Os tokens `--avatar-*` (≥5.8:1, dedicados) continuam reservados só pro fundo sólido do avatar com iniciais brancas — não usar `--brand-*` nem `--avatar-*` como texto pequeno sobre preenchimento sólido sem recalcular contraste (lição da rodada anterior).
- Não existe suíte de testes automatizada — verificação por task é `npx tsc --noEmit` (+ `npm run build` na task final).
- Escopo: `app/globals.css` (só os 3 tokens de glow), `lib/avatar.ts` (novo), `app/(app)/clientes/page.tsx`, `app/(app)/clientes/[id]/page.tsx`, `components/customers/vehicles-section.tsx`. `/clientes/novo` e `/clientes/[id]/editar` ficam fora.
- Commits em português.
- Spec de referência: `docs/superpowers/specs/2026-07-08-clientes-identity-polish-design.md`.

---

### Task 1: Tokens de glow por cor em `app/globals.css`

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `--brand-violet-glow`, `--brand-amber-glow`, `--brand-coral-glow` (dentro de `body.app-theme`, tokens teoricamente invariantes de tema — mesmo padrão de `--brand-teal-glow`, que também não é sobrescrito em `.dark`); registrados no `@theme inline` como `--color-brand-violet-glow`, `--color-brand-amber-glow`, `--color-brand-coral-glow`.
- Consumido por: Task 2 (`lib/avatar.ts`, dentro dos valores de `AVATAR_HOVER_CARD`).

- [ ] **Step 1: Adicionar os 3 tokens de glow em `body.app-theme`**

Em `app/globals.css`, logo depois da linha `--brand-teal-glow:  rgba(0, 191, 166, 0.15);`:

```css
  --brand-teal-glow:  rgba(0, 191, 166, 0.15);
  --brand-violet-glow: rgba(139, 92, 246, 0.15);
  --brand-amber-glow:  rgba(255, 176, 32, 0.15);
  --brand-coral-glow:  rgba(255, 107, 107, 0.15);
```

(Só a linha `--brand-teal-glow` já existe — adicionar as 3 novas logo abaixo dela.)

- [ ] **Step 2: Registrar no `@theme inline`**

Logo depois da linha `--color-brand-teal-glow: var(--brand-teal-glow);` (dentro do bloco `@theme inline`):

```css
  --color-brand-teal-glow: var(--brand-teal-glow);
  --color-brand-violet-glow: var(--brand-violet-glow);
  --color-brand-amber-glow:  var(--brand-amber-glow);
  --color-brand-coral-glow:  var(--brand-coral-glow);
```

(Só a linha `--color-brand-teal-glow` já existe — adicionar as 3 novas logo abaixo dela.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (CSS não afeta o typecheck, mas confirma que nada mais quebrou).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: tokens de glow decorativo pra violeta/ambar/coral (paridade com o teal)"
```

---

### Task 2: Módulo compartilhado `lib/avatar.ts`

**Files:**
- Create: `lib/avatar.ts`

**Interfaces:**
- Consumes: `--brand-violet-glow`/`--brand-amber-glow`/`--brand-coral-glow` (Task 1, via `var(--...)` dentro das strings de `AVATAR_HOVER_CARD`); tokens `bg-avatar-teal/-violet/-amber/-coral` (já existentes de rodada anterior).
- Produces: `initials(name: string): string`; `avatarColorName(name: string): "teal" | "violet" | "amber" | "coral"`; `AVATAR_BG`, `AVATAR_HOVER_CARD`, `AVATAR_ICON_TEXT`, `AVATAR_BORDER` — todos `Record<AvatarColor, string>`. Consumido por Task 4 (lista) e Task 5 (detalhe).

- [ ] **Step 1: Criar `lib/avatar.ts`**

```ts
const NAMES = ["teal", "violet", "amber", "coral"] as const
export type AvatarColor = (typeof NAMES)[number]

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export function avatarColorName(name: string): AvatarColor {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return NAMES[Math.abs(hash) % NAMES.length]
}

export const AVATAR_BG: Record<AvatarColor, string> = {
  teal: "bg-avatar-teal",
  violet: "bg-avatar-violet",
  amber: "bg-avatar-amber",
  coral: "bg-avatar-coral",
}

export const AVATAR_HOVER_CARD: Record<AvatarColor, string> = {
  teal: "hover:border-brand-teal hover:shadow-[0_0_20px_var(--brand-teal-glow)]",
  violet: "hover:border-brand-violet hover:shadow-[0_0_20px_var(--brand-violet-glow)]",
  amber: "hover:border-brand-amber hover:shadow-[0_0_20px_var(--brand-amber-glow)]",
  coral: "hover:border-brand-coral hover:shadow-[0_0_20px_var(--brand-coral-glow)]",
}

export const AVATAR_ICON_TEXT: Record<AvatarColor, string> = {
  teal: "text-brand-teal",
  violet: "text-brand-violet",
  amber: "text-brand-amber",
  coral: "text-brand-coral",
}

export const AVATAR_BORDER: Record<AvatarColor, string> = {
  teal: "border-brand-teal",
  violet: "border-brand-violet",
  amber: "border-brand-amber",
  coral: "border-brand-coral",
}
```

**Importante (JIT do Tailwind):** cada valor dos 4 `Record` acima é uma string literal completa, exatamente como será usada em produção. Nunca alterar pra montar essas strings por concatenação de variável (ex.: `` `hover:border-brand-${cor}` ``) — o scanner do Tailwind v4 só encontra classes que aparecem como texto literal completo no código-fonte; uma classe montada em runtime não seria gerada no CSS de produção e a página quebraria visualmente só em produção (não no dev, que às vezes é mais permissivo).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add lib/avatar.ts
git commit -m "feat: modulo compartilhado lib/avatar.ts (elimina duplicacao entre lista e detalhe de clientes)"
```

---

### Task 3: `VehiclesSection` — ícone-em-caixa com cor opcional

**Files:**
- Modify: `components/customers/vehicles-section.tsx`

**Interfaces:**
- Produces: nova prop opcional `iconColorClass?: string` em `VehiclesSection`. Consumida pela Task 5 (`clientes/[id]/page.tsx`), que passa `AVATAR_ICON_TEXT[color]`.

- [ ] **Step 1: Adicionar o import de `cn`**

No topo de `components/customers/vehicles-section.tsx`, adicionar (o arquivo hoje não importa `cn`):

```tsx
import { cn } from "@/lib/utils"
```

- [ ] **Step 2: Adicionar a prop `iconColorClass` na assinatura do componente**

A assinatura atual:

```tsx
export function VehiclesSection({ vehicles, customerId }: { vehicles: Vehicle[]; customerId: string }) {
```

Trocar por:

```tsx
export function VehiclesSection({ vehicles, customerId, iconColorClass }: { vehicles: Vehicle[]; customerId: string; iconColorClass?: string }) {
```

- [ ] **Step 3: Trocar o ícone solto de cada veículo por ícone-em-caixa**

O trecho atual, dentro do `.map((v) => ...)`:

```tsx
            <div key={v.id} className="flex items-start justify-between gap-2 p-2 rounded border bg-muted/20">
              <div className="flex items-start gap-2">
                <Bike className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
```

Trocar por:

```tsx
            <div key={v.id} className="flex items-start justify-between gap-2 p-2 rounded border bg-muted/20">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Bike className={cn("h-3.5 w-3.5", iconColorClass ?? "text-muted-foreground")} />
                </div>
                <div>
```

(O resto do bloco — nome do veículo, tipo/cor/voltagem, botões de editar/remover — não muda.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add components/customers/vehicles-section.tsx
git commit -m "feat: VehiclesSection usa icone-em-caixa com cor opcional"
```

---

### Task 4: Lista de clientes — identidade por cliente

**Files:**
- Modify: `app/(app)/clientes/page.tsx`

**Interfaces:**
- Consumes: `initials`, `avatarColorName`, `AVATAR_BG`, `AVATAR_HOVER_CARD`, `AVATAR_ICON_TEXT` (Task 2, de `@/lib/avatar`).

- [ ] **Step 1: Trocar as funções/array locais pelo import de `@/lib/avatar`**

Remover do arquivo (funções `initials` e `avatarColor`, e o array `AVATAR_COLORS` — linhas ~18-46 do arquivo atual):

```tsx
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}
```

```tsx
const AVATAR_COLORS = [
  "bg-avatar-teal",
  "bg-avatar-violet",
  "bg-avatar-amber",
  "bg-avatar-coral",
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
```

Adicionar este import junto aos outros imports locais do arquivo (`@/components/...`):

```tsx
import { initials, avatarColorName, AVATAR_BG, AVATAR_HOVER_CARD, AVATAR_ICON_TEXT } from "@/lib/avatar"
```

- [ ] **Step 2: Atualizar o cálculo da cor dentro do `.map((c) => ...)`**

O trecho atual:

```tsx
            {customers.map((c) => {
              const vCount = vehicleCountMap[c.id] ?? 0
              const color = avatarColor(c.name)
              return (
```

Trocar por:

```tsx
            {customers.map((c) => {
              const vCount = vehicleCountMap[c.id] ?? 0
              const color = avatarColorName(c.name)
              return (
```

- [ ] **Step 3: Aplicar `AVATAR_BG` no avatar**

O trecho atual do avatar:

```tsx
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold select-none ${color}`}
                        >
```

Trocar por:

```tsx
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold select-none ${AVATAR_BG[color]}`}
                        >
```

- [ ] **Step 4: Aplicar o hover por identidade no `<Card>`**

O trecho atual:

```tsx
                  <Card className="group border-border/60 transition-all duration-200 hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 cursor-pointer">
```

Trocar por:

```tsx
                  <Card className={`group border-border/60 transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 cursor-pointer ${AVATAR_HOVER_CARD[color]}`}>
```

- [ ] **Step 5: `font-display` no nome do cliente**

O trecho atual:

```tsx
                            <p className="font-semibold text-sm truncate">{c.name}</p>
```

Trocar por:

```tsx
                            <p className="font-display font-semibold text-sm truncate">{c.name}</p>
```

- [ ] **Step 6: Cor de identidade no ícone `Bike` do badge de veículos**

O trecho atual:

```tsx
                            {vCount > 0 && (
                              <Badge variant="secondary" className="shrink-0 text-xs gap-1 py-0">
                                <Bike className="h-2.5 w-2.5" />
                                {vCount}
                              </Badge>
                            )}
```

Trocar por:

```tsx
                            {vCount > 0 && (
                              <Badge variant="secondary" className="shrink-0 text-xs gap-1 py-0">
                                <Bike className={`h-2.5 w-2.5 ${AVATAR_ICON_TEXT[color]}`} />
                                {vCount}
                              </Badge>
                            )}
```

- [ ] **Step 7: Ícone-em-caixa nas linhas de telefone/email/cidade**

O bloco atual:

```tsx
                          <div className="mt-1.5 space-y-0.5">
                            {(c.whatsapp || c.phone) && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {c.whatsapp ?? c.phone}
                                </span>
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                              </div>
                            )}
                            {(c.city || c.state) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {[c.city, c.state].filter(Boolean).join(" – ")}
                                </span>
                              </div>
                            )}
                          </div>
```

Trocar por (ícone solto vira ícone-em-caixa `bg-muted`, `gap-1.5` vira `gap-2`):

```tsx
                          <div className="mt-1.5 space-y-1">
                            {(c.whatsapp || c.phone) && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {c.whatsapp ?? c.phone}
                                </span>
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                              </div>
                            )}
                            {(c.city || c.state) && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {[c.city, c.state].filter(Boolean).join(" – ")}
                                </span>
                              </div>
                            )}
                          </div>
```

- [ ] **Step 8: `CardContent` padding `p-4` → `p-5`**

O trecho atual:

```tsx
                    <CardContent className="p-4">
```

Trocar por:

```tsx
                    <CardContent className="p-5">
```

- [ ] **Step 9: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 10: Commit**

```bash
git add "app/(app)/clientes/page.tsx"
git commit -m "feat: lista de clientes ganha identidade visual por cliente"
```

---

### Task 5: Detalhe do cliente — identidade por cliente

**Files:**
- Modify: `app/(app)/clientes/[id]/page.tsx`

**Interfaces:**
- Consumes: `initials`, `avatarColorName`, `AVATAR_BG`, `AVATAR_BORDER`, `AVATAR_ICON_TEXT` (Task 2, de `@/lib/avatar`); `VehiclesSection` com a nova prop `iconColorClass` (Task 3).

- [ ] **Step 1: Trocar as funções/array locais pelo import de `@/lib/avatar`**

Remover do arquivo (funções `initials` e `avatarColor`, e o array `AVATAR_COLORS`):

```tsx
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}
```

```tsx
const AVATAR_COLORS = [
  "bg-avatar-teal",
  "bg-avatar-violet",
  "bg-avatar-amber",
  "bg-avatar-coral",
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
```

Adicionar este import junto aos outros imports locais do arquivo:

```tsx
import { initials, avatarColorName, AVATAR_BG, AVATAR_BORDER, AVATAR_ICON_TEXT } from "@/lib/avatar"
```

- [ ] **Step 2: Atualizar o cálculo da cor**

O trecho atual:

```tsx
  const color = avatarColor(customer.name)
```

Trocar por:

```tsx
  const color = avatarColorName(customer.name)
```

- [ ] **Step 3: Aplicar `AVATAR_BG` no avatar do header**

O trecho atual:

```tsx
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-xl font-bold select-none shadow-md ${color}`}
          >
```

Trocar por:

```tsx
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-xl font-bold select-none shadow-md ${AVATAR_BG[color]}`}
          >
```

- [ ] **Step 4: Acento de borda no card de contato**

O trecho atual (`<CardTitle className="text-sm">Informações de contato</CardTitle>` fica dentro deste `<Card>`):

```tsx
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações de contato</CardTitle>
```

Trocar por (só o `<Card>` de contato — não mexer nos outros `<Card className="border-border/60">` da página, como o de estatísticas ou o de histórico de OS):

```tsx
          <Card className={`border-border/60 border-l-2 ${AVATAR_BORDER[color]}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações de contato</CardTitle>
```

- [ ] **Step 5: Passar `iconColorClass` pro `VehiclesSection`**

O trecho atual:

```tsx
          <VehiclesSection vehicles={vehicles ?? []} customerId={id} />
```

Trocar por:

```tsx
          <VehiclesSection vehicles={vehicles ?? []} customerId={id} iconColorClass={AVATAR_ICON_TEXT[color]} />
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/clientes/[id]/page.tsx"
git commit -m "feat: detalhe do cliente ganha identidade visual por cliente"
```

---

### Task 6: Verificação

**Files:** nenhum (só verificação).

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro. Esta é a verificação mais importante desta rodada, já que o risco técnico principal (classes Tailwind montadas em runtime não sendo geradas) só se manifestaria como CSS ausente numa build de produção real, não necessariamente no `tsc` ou no dev server.

- [ ] **Step 2: Grep de sanidade — nenhuma classe Tailwind concatenada por variável**

Run:
```bash
grep -n 'hover:border-brand-\${' "app/(app)/clientes/page.tsx" "app/(app)/clientes/[id]/page.tsx" lib/avatar.ts
```
Expected: nenhum resultado (confirma que não sobrou nenhuma tentativa de montar classe por template string com variável no meio do nome da classe).

- [ ] **Step 3: Verificação visual manual (registrar limitação)**

Mesma limitação de ambiente das rodadas anteriores (sem browser headless autenticado neste ambiente). Escrever relatório em `.superpowers/sdd/task-6-report.md` com o checklist:
- Lista: cada cliente mantém a mesma cor em avatar, glow do hover do card e ícone do badge de scooter.
- Detalhe: avatar, acento de borda do card de contato e ícone dos veículos usam a mesma cor do cliente.
- Ícones de contato (lista e detalhe) em caixinha `bg-muted`.
- Nome do cliente na lista em `font-display`.
- Formulário de adicionar/editar/remover scooter continua funcionando normalmente (nenhuma regressão).
- Conferir numa build de produção real (`npm run build && npm start`) que os glows/bordas coloridos aparecem — não só no dev server (mitiga o risco de JIT citado na Global Constraints).

- [ ] **Step 4: Commit final (se algum ajuste for necessário)**

```bash
git add -A
git commit -m "fix: ajustes de verificacao da identidade visual por cliente"
```

(Só necessário se algo precisar de correção.)
