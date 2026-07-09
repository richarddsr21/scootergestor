# Clientes — Identidade por Cliente (polish visual) — Design Spec

**Goal:** Tornar a lista e o detalhe de clientes mais atraentes/modernos dando a cada cliente uma "cor de identidade" (a mesma cor do avatar) que o acompanha em todos os lugares onde ele aparece — avatar, glow do hover, ícone do card de scooters — e padronizando ícones soltos em ícone-em-caixa (`bg-muted` arredondado), já usado no card de contato do detalhe. Sem inventar linguagem visual nova: reaproveita tokens de marca já existentes (`--brand-teal/-violet/-amber/-coral`) e o padrão de card do painel de instrumentos.

**Escopo:** `app/(app)/clientes/page.tsx`, `app/(app)/clientes/[id]/page.tsx`, `components/customers/vehicles-section.tsx`, mais um módulo novo `lib/avatar.ts` (elimina a duplicação de `initials`/`avatarColor`/`AVATAR_COLORS` entre as duas páginas — apontada como Minor na review final da rodada anterior) e 3 tokens novos em `app/globals.css`.

**Tech stack:** Next.js 16 + TypeScript + Tailwind v4 (inalterado).

---

## 1. Novo módulo compartilhado: `lib/avatar.ts`

Hoje `initials()`, `avatarColor()` e o array `AVATAR_COLORS` existem duplicados e idênticos em `clientes/page.tsx` e `clientes/[id]/page.tsx` (ambos já usam `bg-avatar-teal/-violet/-amber/-coral`). Este spec consolida num módulo só e adiciona os mapas de hover/ícone/borda por cor:

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

**Nota técnica (Tailwind JIT):** cada valor dos 4 `Record` acima precisa aparecer como **string completa e literal** no arquivo — o scanner do Tailwind v4 faz busca textual no código-fonte, não avalia JS em runtime. Por isso os mapas usam classes completas por chave (`"hover:border-brand-teal hover:shadow-[...]"`), nunca concatenação tipo `` `hover:border-${cor}` `` — essa forma NÃO seria encontrada pelo scanner e geraria CSS ausente em produção. Isso já é validado pelo padrão existente (`AVATAR_COLORS` original também usava strings completas).

**Nota de contraste:** `AVATAR_ICON_TEXT`/`AVATAR_BORDER`/`AVATAR_HOVER_CARD` usam as cores de marca (`--brand-*`, não `--avatar-*`) como cor de **ícone** ou **borda/sombra decorativa** — não como texto pequeno sobre preenchimento sólido (esse foi o erro corrigido na rodada anterior). Ícone/borda contra `--card` só precisa de 3:1 (WCAG 1.4.11, não 4.5:1 de texto), e é o mesmo padrão já usado sem problema pelo ícone teal do `KpiTile` contra `bg-card` nas duas rodadas já revisadas. `--avatar-*` (tokens dedicados, ≥5.8:1) continua sendo usado só onde já era usado: fundo sólido do avatar com iniciais brancas.

---

## 2. Tokens novos: glow por cor (`app/globals.css`)

Hoje só existe `--brand-teal-glow`. Adiciona os 3 equivalentes, mesmo formato (rgba do tom base, alpha 0.15), logo após a linha `--brand-teal-glow`:

```css
--brand-violet-glow: rgba(139, 92, 246, 0.15);
--brand-amber-glow:  rgba(255, 176, 32, 0.15);
--brand-coral-glow:  rgba(255, 107, 107, 0.15);
```

E registra no `@theme inline`, junto dos outros `--color-brand-*`:

```css
--color-brand-violet-glow: var(--brand-violet-glow);
--color-brand-amber-glow:  var(--brand-amber-glow);
--color-brand-coral-glow:  var(--brand-coral-glow);
```

(Decorativo — box-shadow não tem requisito de contraste WCAG.)

---

## 3. Lista de clientes (`app/(app)/clientes/page.tsx`)

- Remove `initials`, `AVATAR_COLORS`, `avatarColor` locais; importa de `@/lib/avatar`.
- Para cada cliente: `const color = avatarColorName(c.name)`.
- Avatar: `AVATAR_BG[color]` (já era isso, só muda a origem).
- Nome do cliente: adiciona `font-display` (mantém `font-semibold text-sm truncate` existentes) — `className="font-display font-semibold text-sm truncate"`.
- Hover do `<Card>`: troca o hover fixo teal por `AVATAR_HOVER_CARD[color]` (glow/borda variam por cliente).
- Badge de quantidade de scooter: o ícone `Bike` ganha `AVATAR_ICON_TEXT[color]` (o badge em si — fundo/texto — continua `Badge variant="secondary"`, neutro, sem mudança de contraste).
- Linhas de telefone/email/cidade: ícone solto vira ícone-em-caixa, mesmo padrão do card de contato do detalhe:

```tsx
<div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
  <Phone className="h-3 w-3 text-muted-foreground" />
</div>
```

  (troca `gap-1.5` por `gap-2` nessas linhas pra acomodar a caixa; mesmo tratamento pros ícones `Mail` e `MapPin`.)
- `CardContent`: padding sobe de `p-4` pra `p-5`.

---

## 4. Detalhe do cliente (`app/(app)/clientes/[id]/page.tsx`)

- Remove `initials`, `AVATAR_COLORS`, `avatarColor` locais; importa de `@/lib/avatar`.
- `const color = avatarColorName(customer.name)`.
- Avatar do header: `AVATAR_BG[color]` (já era isso, só muda a origem).
- Card de "Informações de contato": ganha acento de borda esquerda na cor de identidade —

```tsx
<Card className={`border-border/60 border-l-2 ${AVATAR_BORDER[color]}`}>
```

- `VehiclesSection`: recebe uma nova prop opcional `iconColorClass` com `AVATAR_ICON_TEXT[color]`:

```tsx
<VehiclesSection vehicles={vehicles ?? []} customerId={id} iconColorClass={AVATAR_ICON_TEXT[color]} />
```

---

## 5. `components/customers/vehicles-section.tsx`

- Adiciona prop opcional `iconColorClass?: string` (default: sem cor extra, mantém `text-muted-foreground`).
- O ícone `Bike` de cada linha de veículo (hoje solto, `<Bike className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />`) vira ícone-em-caixa, mesmo padrão dos outros lugares:

```tsx
<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
  <Bike className={cn("h-3.5 w-3.5", iconColorClass ?? "text-muted-foreground")} />
</div>
```

  (precisa do import de `cn` de `@/lib/utils`, ainda não usado neste arquivo.)
- Resto do componente (formulário de add/editar/remover veículo, diálogos) não muda — é só a troca do ícone solto pela caixa.

---

## 6. Fora de escopo

- Histórico de OS no detalhe do cliente: cogitei colorir o hover do número da OS pela cor de identidade, mas isso exigiria `group-hover:${cor}` gerado em runtime — não funciona com o scanner estático do Tailwind (ver nota técnica da seção 1) sem mais um mapa de strings completas. Descartado por não valer a complexidade extra nesta rodada.
- `/clientes/novo`, `/clientes/[id]/editar` — continuam fora, como nas rodadas anteriores.
- Formulários/lógica de `VehiclesSection` (add/editar/remover) — só o ícone muda.

---

## 7. Verificação

- `npx tsc --noEmit` + `npm run build`.
- Conferência visual manual (mesma limitação de ambiente das rodadas anteriores):
  - Cada cliente mantém a mesma cor de identidade em todos os lugares (avatar da lista = avatar do detalhe = acento da borda = ícone dos veículos).
  - Hover dos cards da lista mostra glow/borda na cor do cliente, não sempre teal.
  - Ícones de contato (lista e detalhe) em caixinha `bg-muted`, visualmente consistentes.
  - Nome em `font-display` na lista (mesma fonte de título usada no resto do app).
  - Nenhuma regressão no formulário de adicionar/editar/remover scooter.
