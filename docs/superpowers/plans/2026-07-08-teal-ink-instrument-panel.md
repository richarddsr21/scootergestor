# Painel de Instrumentos — Design System v2 + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir a identidade "Teal Ink" já existente (`app/globals.css`, `body.app-theme`) com uma paleta de zona (teal/âmbar/coral + acento violeta), criar o elemento-assinatura "painel de instrumentos digital" (Gauge circular + ZoneBar linear + StatusPill), e aplicar tudo isso no Dashboard — sem tocar nas outras 7+ telas do app (isso fica pra uma próxima rodada).

**Architecture:** Todos os tokens novos são adicionados dentro do bloco `body.app-theme` já existente em `app/globals.css` (mesmo padrão da fundação anterior — zero mudança em `app/(public)`, `app/(auth)`, `app/(admin)`). O Gauge e o ZoneBar são componentes SVG bespoke (sem nova dependência de chart lib — usam `framer-motion`, já instalado, pra animar). O StatusPill é um componente novo em `components/shared/` que passa a ser a referência única pra badges de "zona" (teal/âmbar/coral) — o Dashboard adota ele nesta rodada; migrar as outras telas fica pra depois. Botão/Input/Card já são token-driven (herdam a paleta nova automaticamente); só o `Badge` shadcn tem cor hardcoded (`bg-emerald-100` etc.) e precisa de variantes novas token-driven.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Framer Motion + Recharts (inalterado).

## Global Constraints

- Nunca tocar arquivos sob `app/(public)`, `app/(auth)`, `app/(admin)`, nem `components/landing/`.
- Nunca editar `components/ui/*.tsx` pra mudar comportamento visual do resto do site — exceção já em vigor: `Button`/`Input`/`Badge` só recebem tokens/variantes novas, o comportamento visual do site público (que não carrega `body.app-theme`) não muda porque os tokens só resolvem pros valores novos dentro de `body.app-theme`.
- Zero cor hardcoded em componente — só design tokens (`var(--...)` ou classes Tailwind que resolvem token, nunca `bg-emerald-100` literal).
- Zero emoji como ícone — Lucide, stroke consistente.
- Contraste ≥ 4.5:1, foco visível em todo elemento interativo, `aria-label` em ícone sem texto, nunca só cor pra transmitir estado (zona sempre acompanhada de ícone/texto).
- Animações 150–300ms (exceto a animação de "encher" do gauge, que é um efeito único de carregamento, não um micro-interação — ainda assim precisa respeitar `prefers-reduced-motion`, pulando pro valor final sem animar).
- Nunca animar `width`/`height` — animar `transform`/`opacity`/`stroke-dashoffset`.
- Valores monetários em `font-mono` (`JetBrains Mono`, já carregada).
- Este plano NÃO inclui: migrar Produtos/Estoque/Vendas/Oficina/Orçamentos/Garantias/Caixa-Histórico pro `StatusPill`/qualquer `DataTable` novo, conectar a busca do header, ou tocar em `configuracoes/*`. Ficam documentados como próxima rodada no final deste arquivo.
- Commits em português, seguindo o padrão do repo (`git log --oneline`).
- Não existe suíte de testes automatizada no projeto — verificação por task é `npx tsc --noEmit` + `npm run build`; verificação visual manual fica registrada como pendência (mesma limitação de ambiente já documentada em rodadas anteriores: sem browser headless configurado, dashboard exige sessão autenticada).

---

### Task 1: Paleta de zona + tokens do medidor em `app/globals.css`

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: tokens `--brand-amber`, `--brand-amber-dim`, `--brand-violet`, `--brand-violet-dim` (dentro de `body.app-theme` e `html.dark body.app-theme`); aliases de zona `--zone-optimal`, `--zone-warning`, `--zone-critical` (= teal/amber/coral); registrados no `@theme inline` como `--color-brand-amber`, `--color-brand-amber-dim`, `--color-brand-violet`, `--color-brand-violet-dim`, `--color-zone-optimal`, `--color-zone-warning`, `--color-zone-critical` (permite classes `bg-brand-amber`, `text-zone-warning` etc.); classes utilitárias `.badge-zone-optimal`, `.badge-zone-warning`, `.badge-zone-critical`, `.badge-zone-neutral`.
- Consumido por: Task 2 (Badge), Task 4 (Gauge), Task 5 (ZoneBar), Task 6 (StatusPill), Task 8 (Dashboard).

- [ ] **Step 1: Adicionar os tokens de cor no bloco `body.app-theme` (light)**

Em `app/globals.css`, dentro do bloco `body.app-theme { ... }` (que já existe, linhas 89-129), logo depois da linha `--brand-coral-dim: #E05555;`, adicionar:

```css
  --brand-amber:      #FFB020;
  --brand-amber-dim:  #DB9200;
  --brand-violet:     #8B5CF6;
  --brand-violet-dim: #7C3AED;

  --zone-optimal:  var(--brand-teal-dim);
  --zone-warning:  var(--brand-amber-dim);
  --zone-critical: var(--brand-coral-dim);
```

- [ ] **Step 2: Adicionar os tokens de cor no bloco `html.dark body.app-theme` (dark)**

No bloco `html.dark body.app-theme { ... }` (linhas 131-159), logo depois de `--destructive: var(--brand-coral);`, adicionar:

```css
  --brand-amber:      #FFC44D;
  --brand-amber-dim:  #FFB020;
  --brand-violet:     #A78BFA;
  --brand-violet-dim: #8B5CF6;

  --zone-optimal:  var(--brand-teal);
  --zone-warning:  var(--brand-amber);
  --zone-critical: var(--brand-coral);
```

(Tons mais claros no dark mode, mesma lógica já usada por `--brand-teal`/`--brand-coral` no arquivo — mais saturado/vivo contra o fundo escuro, mais "dim"/contido contra o fundo claro.)

- [ ] **Step 3: Registrar os tokens novos no `@theme inline`**

No bloco `@theme inline { ... }` (linhas 161-217), na seção "Brand tokens → classes bg-brand-*, text-brand-*", logo depois de `--color-brand-ink: var(--brand-ink);`, adicionar:

```css
  --color-brand-amber:      var(--brand-amber);
  --color-brand-amber-dim:  var(--brand-amber-dim);
  --color-brand-violet:     var(--brand-violet);
  --color-brand-violet-dim: var(--brand-violet-dim);
  --color-zone-optimal:     var(--zone-optimal);
  --color-zone-warning:     var(--zone-warning);
  --color-zone-critical:    var(--zone-critical);
```

- [ ] **Step 4: Adicionar as classes utilitárias `.badge-zone-*`**

No final do arquivo (depois da última regra, `@media (prefers-reduced-motion: reduce) { ... }`, linha 361-369), adicionar:

```css

/* ── Badges de zona (teal/âmbar/coral) — usados pelo StatusPill ──
   Token-driven: nunca usar bg-emerald-100 etc. direto num componente. */
.badge-zone-optimal {
  background-color: color-mix(in oklab, var(--zone-optimal) 15%, transparent);
  color: var(--zone-optimal);
}
.badge-zone-warning {
  background-color: color-mix(in oklab, var(--zone-warning) 15%, transparent);
  color: var(--zone-warning);
}
.badge-zone-critical {
  background-color: color-mix(in oklab, var(--zone-critical) 15%, transparent);
  color: var(--zone-critical);
}
.badge-zone-neutral {
  background-color: var(--muted);
  color: var(--muted-foreground);
}
```

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros (só CSS foi alterado, mas o build valida a sintaxe do Tailwind).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat: paleta de zona (ambar/violeta) e tokens do painel de instrumentos"
```

---

### Task 2: `Badge` — variantes de zona token-driven

**Files:**
- Modify: `components/ui/badge.tsx`

**Interfaces:**
- Consumes: `--color-zone-optimal/warning/critical`, `.badge-zone-*` (Task 1).
- Produces: variantes `zoneOptimal`, `zoneWarning`, `zoneCritical` em `badgeVariants` — usadas pelo `StatusPill` (Task 6) e diretamente no Dashboard (Task 8) pra substituir badges com cor Tailwind hardcoded.

- [ ] **Step 1: Adicionar as 3 variantes novas em `components/ui/badge.tsx`**

O arquivo atual (`components/ui/badge.tsx`) tem este bloco `variants` dentro de `badgeVariants` (cva):

```tsx
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
```

`success`/`warning`/`info` têm zero usos no código (confirmado via grep) e usam cor Tailwind literal — não mexer neles nesta task (fora de escopo, não fazem parte do sistema de zona). Adicionar 3 variantes novas logo depois de `info`:

```tsx
        zoneOptimal:
          "border-transparent badge-zone-optimal",
        zoneWarning:
          "border-transparent badge-zone-warning",
        zoneCritical:
          "border-transparent badge-zone-critical",
```

O arquivo completo do bloco `variants` fica:

```tsx
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        zoneOptimal:
          "border-transparent badge-zone-optimal",
        zoneWarning:
          "border-transparent badge-zone-warning",
        zoneCritical:
          "border-transparent badge-zone-critical",
      },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "feat: variantes de zona (optimal/warning/critical) no Badge, token-driven"
```

---

### Task 3: `Button` — estado de loading

**Files:**
- Modify: `components/ui/button.tsx`

**Interfaces:**
- Produces: prop `loading?: boolean` em `Button` — quando `true`, desabilita o botão e mostra um spinner (`Loader2` do lucide-react) no lugar do conteúdo à esquerda, mantendo o texto visível (não troca o botão por só-spinner, pra não mudar a largura/altura — "nunca animar width/height").

- [ ] **Step 1: Adicionar a prop `loading` em `components/ui/button.tsx`**

Arquivo atual:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

Substituir por:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
```

(Quando `asChild` é usado com `Link`/`Slot`, `loading` continua funcionando pois `Comp` renderiza os `children` normalmente — só não passa `disabled` pro filho quando `asChild`, já que links não têm atributo `disabled`; isso é aceitável porque `asChild` no código atual só é usado em botões de navegação, não em ações assíncronas.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat: estado de loading no Button (spinner + aria-busy)"
```

---

### Task 4: Componente `Gauge` (assinatura — medidor circular)

**Files:**
- Create: `components/dashboard/gauge.tsx`

**Interfaces:**
- Consumes: `--brand-teal-dim`/`--brand-teal` (zona ótima), `--brand-amber-dim`/`--brand-amber` (zona atenção), `--brand-coral-dim`/`--brand-coral` (zona crítica) via classes `stroke-zone-optimal` etc. (Task 1).
- Produces: `Gauge({ value, target, format, label, size? })` — usado pela Task 8 no KPI hero do Dashboard. `target` é o valor de referência (mês anterior) que define as 3 zonas: `value >= target` → ótimo (teal), `value >= target * 0.7` → atenção (âmbar), abaixo disso → crítico (coral). A agulha aponta proporcionalmente a `value / (max(value, target) * 1.15)`, animada com spring (framer-motion), pulando direto pro valor final se `prefers-reduced-motion`.

- [ ] **Step 1: Criar `components/dashboard/gauge.tsx`**

```tsx
"use client"

import * as React from "react"
import { useReducedMotion, animate } from "framer-motion"
import { cn } from "@/lib/utils"

interface GaugeProps {
  /** Valor atual (ex.: faturamento do mês) */
  value: number
  /** Valor de referência que define as zonas (ex.: faturamento do mês anterior) */
  target: number
  format: (n: number) => string
  label: string
  size?: number
  className?: string
}

const R = 80
const CX = 100
const CY = 100
// Arco semicircular do ponto esquerdo (180°) ao ponto direito (0°), passando por cima.
const ARC_D = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

export function Gauge({ value, target, format, label, size = 220, className }: GaugeProps) {
  const prefersReducedMotion = useReducedMotion()
  const [animatedPct, setAnimatedPct] = React.useState(0)

  const max = Math.max(value, target * 1.15, 1)
  const pct = Math.min(Math.max(value / max, 0), 1)
  const warningBoundary = Math.min(Math.max((target * 0.7) / max, 0), 1)
  const optimalBoundary = Math.min(Math.max(target / max, 0), 1)

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedPct(pct)
      return
    }
    const controls = animate(0, pct, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setAnimatedPct(v),
    })
    return () => controls.stop()
  }, [pct, prefersReducedMotion])

  const zoneLabel =
    value >= target ? "ótimo" : value >= target * 0.7 ? "atenção" : "crítico"
  const zoneClass =
    value >= target
      ? "text-zone-optimal"
      : value >= target * 0.7
        ? "text-zone-warning"
        : "text-zone-critical"

  const needleDeg = -90 + animatedPct * 180
  const criticalLen = warningBoundary * 100
  const warningLen = (optimalBoundary - warningBoundary) * 100
  const optimalLen = (1 - optimalBoundary) * 100

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox="0 0 200 115"
        width={size}
        height={size * 0.575}
        role="img"
        aria-label={`${label}: ${format(value)}, ${Math.round((value / target) * 100)}% da referência, zona ${zoneLabel}`}
      >
        <path d={ARC_D} pathLength={100} className="stroke-border" strokeWidth={14} fill="none" strokeLinecap="round" />
        <path
          d={ARC_D}
          pathLength={100}
          strokeDasharray={`${criticalLen} ${100 - criticalLen}`}
          strokeDashoffset={0}
          className="stroke-zone-critical"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={ARC_D}
          pathLength={100}
          strokeDasharray={`${warningLen} ${100 - warningLen}`}
          strokeDashoffset={-criticalLen}
          className="stroke-zone-warning"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={ARC_D}
          pathLength={100}
          strokeDasharray={`${optimalLen} ${100 - optimalLen}`}
          strokeDashoffset={-(criticalLen + warningLen)}
          className="stroke-zone-optimal"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R + 18}
          stroke="var(--foreground)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${needleDeg}deg)`,
          }}
        />
        <circle cx={CX} cy={CY} r={6} className="fill-foreground" />
      </svg>
      <p className={cn("font-mono text-3xl font-bold tabular-nums -mt-2", zoneClass)}>
        {format(value)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {label} · {Math.round((value / (target || 1)) * 100)}% do mês anterior
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/gauge.tsx
git commit -m "feat: componente Gauge (assinatura visual do painel de instrumentos)"
```

---

### Task 5: Componente `ZoneBar` (mini-medidor linear)

**Files:**
- Create: `components/dashboard/zone-bar.tsx`

**Interfaces:**
- Consumes: `--zone-optimal/warning/critical` (Task 1).
- Produces: `ZoneBar({ value, max, warningAt?, criticalAt?, label })` — barra linear que reaproveita a mesma linguagem de zona do Gauge em escala menor. `warningAt`/`criticalAt` são frações de `max` (default `0.05` e `0.2`) acima das quais a cor muda. Usado pela Task 8 no tile "Estoque Baixo".

- [ ] **Step 1: Criar `components/dashboard/zone-bar.tsx`**

```tsx
"use client"

import { cn } from "@/lib/utils"

interface ZoneBarProps {
  value: number
  max: number
  warningAt?: number
  criticalAt?: number
  label: string
  className?: string
}

export function ZoneBar({
  value,
  max,
  warningAt = 0.05,
  criticalAt = 0.2,
  label,
  className,
}: ZoneBarProps) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const zone = ratio >= criticalAt ? "critical" : ratio >= warningAt ? "warning" : "optimal"
  const zoneBarClass = {
    optimal: "bg-zone-optimal",
    warning: "bg-zone-warning",
    critical: "bg-zone-critical",
  }[zone]
  const zoneTextClass = {
    optimal: "text-zone-optimal",
    warning: "text-zone-warning",
    critical: "text-zone-critical",
  }[zone]

  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", zoneBarClass)}
          style={{ width: `${Math.max(ratio * 100, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <p className={cn("mt-1 text-[11px] font-medium", zoneTextClass)}>{label}</p>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/zone-bar.tsx
git commit -m "feat: componente ZoneBar (mini-medidor linear reaproveitando a linguagem de zona)"
```

---

### Task 6: Componente `StatusPill` (badge de zona com ícone obrigatório)

**Files:**
- Create: `components/shared/status-pill.tsx`

**Interfaces:**
- Consumes: `Badge` variantes `zoneOptimal`/`zoneWarning`/`zoneCritical` (Task 2).
- Produces: `StatusPill({ zone, label, icon? })` — badge de zona que SEMPRE mostra um ícone (nunca só cor, por padrão usa um ícone default por zona se nenhum for passado) — satisfaz o inegociável "cor nunca é o único indicador". Usado pela Task 8 na prioridade das "OS recentes" do Dashboard.

- [ ] **Step 1: Criar `components/shared/status-pill.tsx`**

```tsx
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

type Zone = "optimal" | "warning" | "critical"

interface StatusPillProps {
  zone: Zone
  label: string
  icon?: React.ReactNode
  className?: string
}

const ZONE_VARIANT: Record<Zone, "zoneOptimal" | "zoneWarning" | "zoneCritical"> = {
  optimal: "zoneOptimal",
  warning: "zoneWarning",
  critical: "zoneCritical",
}

const ZONE_DEFAULT_ICON: Record<Zone, LucideIcon> = {
  optimal: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
}

export function StatusPill({ zone, label, icon, className }: StatusPillProps) {
  const DefaultIcon = ZONE_DEFAULT_ICON[zone]
  return (
    <Badge variant={ZONE_VARIANT[zone]} className={className}>
      {icon ?? <DefaultIcon aria-hidden="true" />}
      {label}
    </Badge>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/shared/status-pill.tsx
git commit -m "feat: componente StatusPill (badge de zona com icone obrigatorio)"
```

---

### Task 7: Foco visível nos itens de navegação (Sidebar + Bottom Nav)

**Files:**
- Modify: `components/layout/app-sidebar.tsx`
- Modify: `components/layout/app-bottom-nav.tsx`

**Interfaces:**
- Nenhuma nova — só adiciona `focus-visible` explícito aos `<Link>` de navegação, que hoje não têm nenhum estilo de foco definido (diferente de `Button`, que já herda foco do shadcn). Constraint do usuário: "focus ring visível em tudo interativo".

- [ ] **Step 1: Adicionar `focus-visible` nos links do `SidebarNav` em `components/layout/app-sidebar.tsx`**

No arquivo atual, o link do item **expandido** (não-collapsed) tem esta className (dentro de `SidebarNav`):

```tsx
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                    isActive
                      ? "border-l-2 border-brand-teal bg-brand-teal-glow text-brand-teal font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
```

Trocar por (adiciona `outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar`):

```tsx
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    isActive
                      ? "border-l-2 border-brand-teal bg-brand-teal-glow text-brand-teal font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
```

E o link do item **collapsed** (dentro do mesmo arquivo, bloco `if (collapsed) { ... }`), que tem:

```tsx
                        className={cn(
                          "relative flex size-9 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-brand-teal-glow text-brand-teal border-l-2 border-brand-teal"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
```

Trocar por:

```tsx
                        className={cn(
                          "relative flex size-9 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                          isActive
                            ? "bg-brand-teal-glow text-brand-teal border-l-2 border-brand-teal"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
```

- [ ] **Step 2: Adicionar `focus-visible` nos links do `AppBottomNav` em `components/layout/app-bottom-nav.tsx`**

No arquivo atual, o `<Link>` de cada item principal tem:

```tsx
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] transition-transform active:scale-[0.92] motion-reduce:transition-none motion-reduce:active:scale-100",
              active ? "text-brand-teal" : "text-muted-foreground"
            )}
```

Trocar por:

```tsx
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] transition-transform active:scale-[0.92] motion-reduce:transition-none motion-reduce:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              active ? "text-brand-teal" : "text-muted-foreground"
            )}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/layout/app-sidebar.tsx components/layout/app-bottom-nav.tsx
git commit -m "fix: foco visivel explicito nos links de navegacao (sidebar e bottom nav)"
```

---

### Task 8: Dashboard — aplicar Gauge, ZoneBar e StatusPill

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Gauge` (Task 4), `ZoneBar` (Task 5), `StatusPill` (Task 6), `Badge` variantes de zona (Task 2), tokens `--brand-violet` (Task 1).

- [ ] **Step 1: Adicionar a query de faturamento do mês anterior**

No array `Promise.all` de `app/(app)/dashboard/page.tsx` (que hoje tem 14 queries), adicionar uma 15ª query. Primeiro, adicionar o cálculo do intervalo do mês anterior logo depois de `const sevenDaysAgoStr = ...`:

```tsx
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStart = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-01`
  const prevMonthEnd = monthStart
```

Depois, no `Promise.all` existente, a desestruturação começa assim:

```tsx
  const [
    { data: todayPayments },
    { data: monthPayments },
    { data: recentPayments },
    { count: openOsCount },
    { data: lowStockProducts },
    { count: customerCount },
    { count: waitingApprovalCount },
    { count: completedTodayCount },
    { data: recentOs },
    { data: recentSales },
    { data: thirtyDayPayments },
    { data: sevenDayOsCreated },
    { data: monthSales },
    { data: monthOs },
  ] = await Promise.all([
```

Trocar a última linha (`{ data: monthOs },`) por:

```tsx
    { data: monthOs },
    { data: prevMonthPayments },
  ] = await Promise.all([
```

E, no array de queries logo abaixo, a última entrada hoje é:

```tsx
    supabase
      .from("service_orders")
      .select("customer_id")
      .eq("company_id", cid)
      .gte("created_at", monthStart)
      .not("customer_id", "is", null),
  ])
```

Trocar por (adiciona a nova query antes do fechamento `])`):

```tsx
    supabase
      .from("service_orders")
      .select("customer_id")
      .eq("company_id", cid)
      .gte("created_at", monthStart)
      .not("customer_id", "is", null),
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed")
      .eq("company_id", cid)
      .gte("paid_at", prevMonthStart)
      .lt("paid_at", prevMonthEnd),
  ])
```

- [ ] **Step 2: Calcular o faturamento do mês anterior**

Logo depois de `const monthRevenue = ...`, adicionar:

```tsx
  const prevMonthRevenue = (prevMonthPayments ?? []).reduce((s, p) => s + netAmount(p), 0)
```

- [ ] **Step 3: Substituir o `KpiTile` hero pelo `Gauge`**

Adicionar os imports no topo do arquivo:

```tsx
import { Gauge } from "@/components/dashboard/gauge"
import { ZoneBar } from "@/components/dashboard/zone-bar"
import { StatusPill } from "@/components/shared/status-pill"
```

No bloco "Bento hero: 4 KPIs principais", trocar o primeiro `<KpiTile size="hero" .../>` por um card contendo o `Gauge`:

```tsx
        <div className="col-span-2 row-span-2 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3),0_0_24px_var(--brand-teal-glow)]">
          <Gauge
            value={monthRevenue}
            target={prevMonthRevenue}
            format={fmt}
            label="Faturamento do Mês"
          />
        </div>
```

(Substitui inteiramente o antigo `<KpiTile size="hero" ... />` — o `href="/relatorios"` do card antigo não é mantido no gauge em si porque o gauge não é clicável como um todo; se quiser navegar pra relatórios, isso é coberto pelos outros KPIs/links já presentes na página. `monthRevenue`/`prevMonthRevenue`/`fmt` já existem no escopo da função.)

- [ ] **Step 4: Trocar o `KpiTile` de "Estoque Baixo" pra incluir o `ZoneBar`**

O card de "Estoque Baixo" atual é:

```tsx
        <KpiTile
          title="Estoque Baixo"
          numericValue={lowStockCount}
          icon={<AlertTriangle />}
          href="/estoque"
        />
```

Trocar por (mantém o `KpiTile` como envoltório visual, mas adiciona a barra de zona como `sparkline`-like extra via `className` — como `KpiTile` não aceita um slot extra, a abordagem mais simples e sem tocar em `kpi-tile.tsx` é envolver o `ZoneBar` num card próprio, coerente com o restante do bento):

```tsx
        <div className="group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
          <Link href="/estoque" className="absolute inset-0 z-10" aria-label="Ver estoque baixo">
            <span className="sr-only">Ver estoque baixo</span>
          </Link>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estoque Baixo
            </p>
            <AlertTriangle className="size-5 shrink-0 text-brand-teal" aria-hidden="true" />
          </div>
          <p className="font-mono text-2xl font-medium tabular-nums text-foreground">
            {lowStockCount}
          </p>
          <ZoneBar
            value={lowStockCount}
            max={(lowStockProducts ?? []).length}
            label={`${(lowStockProducts ?? []).length > 0 ? Math.round((lowStockCount / (lowStockProducts ?? []).length) * 100) : 0}% do catálogo`}
          />
        </div>
```

- [ ] **Step 5: Trocar `StatusBadge` de prioridade nas "OS recentes" por `StatusPill`**

No bloco "OS recentes" (`sortedRecentOs.map(...)`), o código atual mostra só o status (`service_order_statuses`), não a prioridade, via `StatusBadge`. Adicionar a prioridade como um `StatusPill` ao lado, mapeando `os.priority` pra zona. Adicionar esta função auxiliar logo antes de `export default async function DashboardPage()`:

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

E no JSX de cada item de `sortedRecentOs`, trocar:

```tsx
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-medium">{os.order_number}</span>
                        {os.service_order_statuses && (
                          <StatusBadge label={os.service_order_statuses.name} color={os.service_order_statuses.color} />
                        )}
                      </div>
```

Por:

```tsx
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-medium">{os.order_number}</span>
                        {os.service_order_statuses && (
                          <StatusBadge label={os.service_order_statuses.name} color={os.service_order_statuses.color} />
                        )}
                        {(os.priority === "urgente" || os.priority === "alta") && (
                          <StatusPill zone={priorityZone(os.priority)} label={priorityLabel(os.priority)} />
                        )}
                      </div>
```

(Só mostra o `StatusPill` quando a prioridade é urgente/alta — normal/baixa não precisam de destaque extra, já é a maioria silenciosa; isso evita poluir a lista com pill em toda linha.)

- [ ] **Step 6: Trocar o `Badge` inline hardcoded (OS/Venda) em "Pagamentos recentes" por tokens**

O código atual:

```tsx
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${isOs ? "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300" : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"}`}
                        >
                          {isOs ? "OS" : "Venda"}
                        </Badge>
```

Trocar por (usa `--brand-violet` novo pra "OS", e a variante `secondary` já token-driven do próprio Badge pra "Venda" — zero classe Tailwind de cor hardcoded):

```tsx
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 shrink-0",
                            isOs && "bg-brand-violet/15 text-brand-violet"
                          )}
                        >
                          {isOs ? "OS" : "Venda"}
                        </Badge>
```

Isso exige importar `cn` no topo do arquivo (`import { cn } from "@/lib/utils"`), caso ainda não esteja importado (não está, hoje o arquivo usa apenas template string).

- [ ] **Step 7: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add "app/(app)/dashboard/page.tsx"
git commit -m "feat: dashboard aplica Gauge, ZoneBar e StatusPill (painel de instrumentos)"
```

---

### Task 9: Verificação

**Files:** nenhum (só verificação).

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 2: Verificação visual manual (registrar limitação)**

Este ambiente não tem browser headless configurado (`chromium-cli`/Playwright) nem sessão autenticada disponível pra Supabase — a mesma limitação já documentada na rodada anterior. Escrever um relatório em `.superpowers/sdd/task-9-report.md` listando o checklist que precisa de conferência humana:
- Gauge: agulha aponta pra zona certa (teal se `monthRevenue >= prevMonthRevenue`, âmbar entre 70-100%, coral abaixo de 70%), número formatado em `R$`, legenda "X% do mês anterior" legível.
- ZoneBar do tile "Estoque Baixo": barra preenche proporcionalmente, cor muda de zona ao passar dos limiares.
- StatusPill: aparece só em OS urgente/alta, ícone + texto (nunca só cor).
- Badge OS/Venda: cor violeta/secundária legível nos dois temas (claro/escuro).
- Foco visível (Tab) nos itens do sidebar e do bottom nav.
- `prefers-reduced-motion`: agulha do gauge aparece direto na posição final, sem animação de "subida".
- Contraste dos textos de zona (`text-zone-warning` etc.) ≥ 4.5:1 nos dois temas.

- [ ] **Step 3: Commit final (se algum ajuste for necessário)**

```bash
git add -A
git commit -m "fix: ajustes de verificacao do painel de instrumentos"
```

(Só necessário se algo precisar de correção.)

---

## Próxima rodada (fora de escopo deste plano)

Documentado aqui pra não se perder, não pra executar agora:

1. Migrar as 7 telas de tabela crua (`Produtos`, `Estoque`, `Vendas`, `Oficina`, `Orçamentos`, `Garantias`, `Caixa/Histórico`) pro primitivo shadcn `Table` real, com um `DataTable` compartilhado.
2. Unificar os 4+ sistemas de "card de métrica" (`MetricCard`, ad hoc Estoque/Financeiro, Caixa sem ícone, Relatórios) em cima do `KpiTile`/novo sistema.
3. Migrar `StatusBadge`/`Badge` com `STATUS_COLORS` hardcoded (Vendas, Oficina, Orçamentos, Garantias) pro `StatusPill`.
4. Conectar a busca do `AppHeader` (hoje decorativa).
5. `loading.tsx` por rota (hoje só existe um, com formato de Dashboard, usado em toda tela).
6. Remover `components/ui/form.tsx` (morto) e a rota vazia `app/(app)/oficina/kanban/`.
7. Redesenhar o PDV (`vendas/nova`) — tela mais crítica do dia a dia, hoje a mais crua visualmente.
