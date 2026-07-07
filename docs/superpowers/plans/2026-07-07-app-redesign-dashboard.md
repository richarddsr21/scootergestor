# Redesign do app logado — Fase 1 (fundação + Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolar uma nova identidade visual (teal/ink/coral, Manrope/Inter/JetBrains Mono, bento grid, shell flutuante) só dentro de `/(app)` — sem afetar `/(public)`, `/(auth)` nem `/(admin)` — e aplicá-la à página `/dashboard`.

**Architecture:** Os tokens de cor e as variáveis de fonte são aplicados como classes no `<body>` via `useEffect` no `AppShell` (client component), porque componentes Radix/Sonner renderizam via portal em `document.body` e precisam herdar os mesmos tokens. Refinamento em relação à spec original: em vez de editar os componentes shadcn compartilhados (`button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx` — usados também por `/(public)`, `/(auth)`, `/(admin)`), o comportamento novo (glow, hover lift, timing) é adicionado via CSS em `globals.css` usando seletores `body.app-theme [data-slot="..."]` combinados com as classes utilitárias que o cva já emite (ex.: `.bg-primary`). Isso porque CSS fora de `@layer` sempre vence utilities do Tailwind (que ficam em `@layer utilities`), independente de especificidade — e porque zero linha desses arquivos compartilhados muda, eliminando qualquer risco de vazar pro resto do site. Os novos componentes de dashboard (bento tiles, chips, gráficos) são arquivos próprios em `components/dashboard/`, não usados fora do `(app)`.

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Supabase + Recharts (já instalado) + Framer Motion (novo).

## Global Constraints

- Nunca tocar arquivos sob `app/(public)`, `app/(auth)`, `app/(admin)`, nem os componentes de `components/landing/` (se existirem).
- Nunca editar `components/ui/*.tsx` (shadcn compartilhado) para mudar comportamento visual — só via CSS `body.app-theme [data-slot=...]` em `app/globals.css`. Exceção: instalar um componente shadcn **novo** que ainda não existe (ex.: `sheet.tsx`) é permitido, pois não afeta nada que já usa os componentes existentes.
- O projeto não tem suíte de testes automatizados (`package.json` não tem `test` script nem Vitest/Jest/Playwright). Verificação em cada task é: `npx tsc --noEmit` (typecheck) + checagem visual manual no navegador via `npm run dev`. Não inventar um framework de teste novo — fora de escopo.
- `prefers-reduced-motion` sempre respeitado (CSS: media query; Framer Motion: hook `useReducedMotion`).
- Cor nunca é o único indicador de estado (sempre acompanhada de ícone/texto).
- Todo valor monetário / numérico de KPI usa `font-mono` (JetBrains Mono).
- Commits em português, seguindo o padrão já usado no repo (`git log --oneline`).

---

### Task 1: Dependência Framer Motion

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: pacote `framer-motion` disponível para import em qualquer client component do projeto.

- [ ] **Step 1: Instalar a dependência**

```bash
npm install framer-motion@^12.42.2
```

- [ ] **Step 2: Verificar que o typecheck do projeto continua limpo**

Run: `npx tsc --noEmit`
Expected: sem erros (o pacote só será usado a partir da Task 5).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adiciona framer-motion para animacoes do novo design do app"
```

---

### Task 2: Tokens de design (paleta dark + light, isolados via `body.app-theme`)

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: classe `body.app-theme` (e `html.dark body.app-theme` para o modo escuro) que redefine `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--sidebar*`; além dos tokens novos `--brand-ink`, `--brand-teal`, `--brand-teal-dim`, `--brand-teal-glow`, `--brand-coral`, `--brand-coral-dim`, registrados no `@theme inline` como `--color-brand-teal`, `--color-brand-teal-glow`, `--color-brand-coral` (para permitir classes `bg-brand-teal`, `text-brand-teal`, `border-brand-teal`, `bg-brand-teal-glow`). Nenhuma classe existente (`bg-background`, `text-primary` etc.) muda de nome — só passam a resolver pro valor novo quando `body.app-theme` está presente.

- [ ] **Step 1: Adicionar o bloco de tokens em `app/globals.css`**

Adicionar logo após o bloco `.dark { ... }` existente (antes do `@theme inline`):

Valores em hex direto (não oklch) para garantir fidelidade exata às cores
do spec, sem risco de erro de conversão manual — o resto do arquivo usa
oklch por convenção antiga, mas hex é igualmente válido em CSS moderno e
mais seguro aqui.

```css
/* ── App logado — nova identidade "Teal Ink" ─────────── */
body.app-theme {
  --brand-ink:        #1A1F2E;
  --brand-teal:       #00BFA6;
  --brand-teal-dim:   #00A08C;
  --brand-teal-glow:  rgba(0, 191, 166, 0.15);
  --brand-coral:      #FF6B6B;
  --brand-coral-dim:  #E05555;

  /* Light (padrão do body.app-theme sozinho, sem .dark) */
  --background: #FFFFFF;
  --foreground: var(--brand-ink);
  --card: #F7F8FA;
  --card-foreground: var(--brand-ink);
  --popover: #F7F8FA;
  --popover-foreground: var(--brand-ink);
  --primary: var(--brand-teal-dim);
  --primary-foreground: #FFFFFF;
  --secondary: #EEF0F4;
  --secondary-foreground: var(--brand-ink);
  --muted: #EEF0F4;
  --muted-foreground: #5B6178;
  --accent: #E3E6ED;
  --accent-foreground: var(--brand-ink);
  --destructive: var(--brand-coral-dim);
  --border: rgba(15, 18, 25, 0.08);
  --input: rgba(15, 18, 25, 0.08);
  --ring: var(--brand-teal-dim);

  --sidebar: #F7F8FA;
  --sidebar-foreground: #5B6178;
  --sidebar-primary: var(--brand-teal-dim);
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E3E6ED;
  --sidebar-accent-foreground: var(--brand-ink);
  --sidebar-border: rgba(15, 18, 25, 0.08);
  --sidebar-ring: var(--brand-teal-dim);
}

html.dark body.app-theme {
  --background: #0F1219;   /* surface-0 */
  --foreground: #F0F2F8;   /* text-primary */
  --card: #161B27;         /* surface-1 */
  --card-foreground: #F0F2F8;
  --popover: #161B27;
  --popover-foreground: #F0F2F8;
  --primary: var(--brand-teal);
  --primary-foreground: var(--brand-ink);
  --secondary: #1E2433;    /* surface-2 */
  --secondary-foreground: #F0F2F8;
  --muted: #1E2433;
  --muted-foreground: #8B92A5;  /* text-secondary */
  --accent: #252B3B;       /* surface-3 */
  --accent-foreground: #F0F2F8;
  --destructive: var(--brand-coral);
  --border: rgba(255, 255, 255, 0.06);
  --input: rgba(255, 255, 255, 0.10);
  --ring: var(--brand-teal);

  --sidebar: #161B27;
  --sidebar-foreground: #8B92A5;
  --sidebar-primary: var(--brand-teal);
  --sidebar-primary-foreground: var(--brand-ink);
  --sidebar-accent: #252B3B;
  --sidebar-accent-foreground: #F0F2F8;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: var(--brand-teal);
}
```

- [ ] **Step 2: Registrar os tokens novos como classes utilitárias**

No bloco `@theme inline` já existente, dentro da seção "Brand tokens", adicionar:

```css
  --color-brand-teal:      var(--brand-teal);
  --color-brand-teal-dim:  var(--brand-teal-dim);
  --color-brand-teal-glow: var(--brand-teal-glow);
  --color-brand-coral:     var(--brand-coral);
  --color-brand-coral-dim: var(--brand-coral-dim);
  --color-brand-ink:       var(--brand-ink);
```

- [ ] **Step 3: Recalibrar as classes de badge existentes pro novo par de cores**

Substituir o bloco de badges no final de `app/globals.css` (mantém os mesmos nomes de classe, só ajusta o `dark:` pra usar os tokens novos onde já não fizerem sentido — `emerald`/`red`/`amber` continuam sendo status semânticos universais e não precisam mudar; a única cor realmente ligada à identidade antiga era a ausência de um tom "teal" dedicado). Adicionar uma variante nova:

```css
.badge-teal { @apply bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300; }
```

(As demais classes `.badge-amber/emerald/red/blue/violet/slate/orange` continuam como estão — já usam cores semânticas Tailwind neutras em relação à marca, funcionam igual sob a paleta nova.)

- [ ] **Step 4: Typecheck (garante que CSS não quebrou nada de build)**

Run: `npx tsc --noEmit && npm run build`
Expected: build conclui sem erro (nenhum código TS foi alterado nesta task, mas o build também roda o compilador do Tailwind — confirma que a sintaxe CSS é válida).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: tokens da nova identidade visual Teal Ink isolados em body.app-theme"
```

---

### Task 3: CSS de comportamento para componentes shadcn compartilhados (sem editar os arquivos)

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `--brand-teal`, `--brand-teal-glow` (Task 2).
- Produces: hover/lift/glow no botão primário, timing/overlay do modal — tudo escopado a `body.app-theme`, zero mudança em `components/ui/*.tsx`.

- [ ] **Step 1: Adicionar o bloco de comportamento no final de `app/globals.css`**

```css
/* ── App logado — comportamento (Teal Glow System) ──────
   Escopado a body.app-theme; nunca toca components/ui/*.tsx
   pra não vazar pro resto do site (public/auth/admin). ── */
body.app-theme [data-slot="button"].bg-primary {
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
              filter 150ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
body.app-theme [data-slot="button"].bg-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 0 20px var(--brand-teal-glow);
}
body.app-theme [data-slot="button"].bg-primary:active {
  transform: translateY(0);
  filter: brightness(1);
}

body.app-theme [data-slot="card"] {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.3);
  transition: border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
body.app-theme [data-slot="card"]:hover {
  border-color: var(--brand-teal);
}

body.app-theme [data-slot="dialog-overlay"] {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
body.app-theme [data-slot="dialog-content"] {
  border-radius: 16px;
}
```

- [ ] **Step 2: Verificar visualmente (só é possível confirmar de fato depois da Task 5/6, quando `body.app-theme` passa a existir; por ora, confirmar que o CSS não quebra o build)**

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: glow e timing do botao primario/modal escopados ao app logado"
```

---

### Task 4: Fontes (Manrope, Inter, JetBrains Mono) carregadas só no `(app)`

**Files:**
- Create: `app/(app)/fonts.ts`
- Modify: `app/(app)/layout.tsx`

**Interfaces:**
- Produces: `manrope.variable`, `inter.variable`, `jetbrainsMono.variable` (strings de classe do `next/font`), exportados de `app/(app)/fonts.ts`.
- Consumes (na Task 5): essas 3 strings, concatenadas, viram a prop `fontVariables` do `AppShell`.

- [ ] **Step 1: Criar `app/(app)/fonts.ts`**

```ts
import { Manrope, Inter, JetBrains_Mono } from "next/font/google"

export const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
})

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})
```

- [ ] **Step 2: Mapear as variáveis de fonte pro `body.app-theme` em `app/globals.css`**

Adicionar dentro do bloco `body.app-theme { ... }` criado na Task 2 (junto dos outros tokens, no topo):

```css
  --font-sans: var(--font-inter), "Inter", system-ui, sans-serif;
  --font-display: var(--font-manrope), "Manrope", sans-serif;
  --font-mono: var(--font-jbmono), ui-monospace, monospace;
```

- [ ] **Step 3: Passar as variáveis pro `AppLayout` → `AppShell`**

Editar `app/(app)/layout.tsx`, adicionando o import e a prop nova ao `<AppShell>` (o restante do arquivo continua igual):

```tsx
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AuthProvider } from "@/components/providers/auth-provider"
import { manrope, inter, jetbrainsMono } from "./fonts"
import type { Profile, Company } from "@/types/app"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const supabase = await createClient()
  const [{ data: company }, { data: lowStockProducts }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", profile.company_id).single(),
    supabase
      .from("products")
      .select("stock_quantity, minimum_stock")
      .eq("company_id", profile.company_id)
      .eq("status", "active"),
  ])
  const lowStockCount = (lowStockProducts ?? []).filter(
    (p) => p.stock_quantity <= p.minimum_stock
  ).length

  if (!company) redirect("/onboarding")

  return (
    <AuthProvider
      profile={profile as Profile}
      company={company as Company}
    >
      <AppShell
        profile={profile as Profile}
        companyName={company.name}
        lowStockCount={lowStockCount ?? 0}
        fontVariables={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: erro esperado nesta task — `AppShell` ainda não aceita a prop `fontVariables` (será adicionada na Task 5). Confirmar que o único erro é exatamente esse (`Property 'fontVariables' does not exist...` ou `is missing in type`).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/fonts.ts" "app/(app)/layout.tsx" app/globals.css
git commit -m "feat: carrega Manrope/Inter/JetBrains Mono para o app logado"
```

---

### Task 5: `AppShell` — aplica o tema, transição de página, textura de fundo

**Files:**
- Modify: `components/layout/app-shell.tsx`

**Interfaces:**
- Consumes: `fontVariables: string` (Task 4).
- Produces: classe `app-theme` + variáveis de fonte aplicadas em `document.body` enquanto o `(app)` está montado; estado `mobileNavOpen`/`setMobileNavOpen` (consumido pela Task 6 em `AppSidebar`/`AppHeader`); `<AppBottomNav>` renderizado (consumido pela Task 6, que cria o componente — nesta task ele é importado mas o arquivo só existirá ao final da Task 6, então o typecheck desta task falha até lá, o que é esperado e documentado no Step 4).

- [ ] **Step 1: Reescrever `components/layout/app-shell.tsx`**

```tsx
"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AppBottomNav } from "@/components/layout/app-bottom-nav"
import type { Profile } from "@/types/app"

interface AppShellProps {
  children: React.ReactNode
  profile: Profile
  companyName?: string | null
  lowStockCount?: number
  fontVariables: string
}

export function AppShell({
  children,
  profile,
  companyName,
  lowStockCount = 0,
  fontVariables,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  React.useEffect(() => {
    const classes = ["app-theme", ...fontVariables.split(" ").filter(Boolean)]
    document.body.classList.add(...classes)
    return () => {
      document.body.classList.remove(...classes)
    }
  }, [fontVariables])

  React.useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--brand-teal-glow),transparent_60%)] opacity-60" />

      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        companyName={companyName ?? undefined}
        lowStockCount={lowStockCount}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader profile={profile} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <AppBottomNav lowStockCount={lowStockCount} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck (falha esperada até a Task 6 existir)**

Run: `npx tsc --noEmit`
Expected: erro `Cannot find module '@/components/layout/app-bottom-nav'` e props novas faltando em `AppSidebar`/`AppHeader` — todos esperados, resolvidos na Task 6. Confirmar que **não há outros erros** além desses.

- [ ] **Step 3: Commit**

```bash
git add components/layout/app-shell.tsx
git commit -m "feat: AppShell aplica tema/fontes no body e adiciona transicao de pagina"
```

---

### Task 6: Shell flutuante — sidebar, header, bottom nav mobile, drawer tablet

**Files:**
- Modify: `components/layout/app-sidebar.tsx`
- Modify: `components/layout/app-header.tsx`
- Create: `components/ui/sheet.tsx` (via shadcn CLI)
- Create: `components/layout/app-bottom-nav.tsx`

**Interfaces:**
- Consumes: `mobileOpen`/`onMobileClose` (de `AppShell`, Task 5); tokens `--brand-teal`, `--brand-coral` (Task 2).
- Produces: `AppSidebar({ collapsed, onToggle, companyName?, lowStockCount?, mobileOpen, onMobileClose })`; `AppHeader({ profile?, onMenuClick })`; `AppBottomNav({ lowStockCount? })`.

- [ ] **Step 1: Instalar o componente `Sheet` do shadcn**

```bash
npx shadcn@latest add sheet
```

Expected: cria `components/ui/sheet.tsx` (padrão shadcn, usa `@radix-ui/react-dialog` já instalado por baixo).

- [ ] **Step 2: Reescrever `components/layout/app-sidebar.tsx`**

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Package, Boxes, ShoppingCart, Wrench, ShieldCheck,
  DollarSign, BarChart3, Settings, ChevronLeft, ChevronRight, Zap, Truck,
  FileText, Landmark, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navGroups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Clientes", href: "/clientes", icon: Users },
      { title: "Produtos", href: "/produtos", icon: Package },
      { title: "Estoque", href: "/estoque", icon: Boxes },
      { title: "Vendas", href: "/vendas", icon: ShoppingCart },
      { title: "Oficina", href: "/oficina", icon: Wrench },
      { title: "Orçamentos", href: "/oficina/orcamentos", icon: FileText },
    ],
  },
  {
    label: "Controle",
    items: [
      { title: "Garantias", href: "/garantias", icon: ShieldCheck },
      { title: "Caixa", href: "/caixa", icon: Landmark },
      { title: "Financeiro", href: "/financeiro", icon: DollarSign },
      { title: "Relatórios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Fornecedores", href: "/fornecedores", icon: Truck },
      { title: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

function useActiveItem() {
  const pathname = usePathname()
  return React.useCallback(
    (href: string) => {
      if (pathname !== href && !pathname.startsWith(href + "/")) return false
      return !allItems.some(
        (other) =>
          other.href !== href &&
          other.href.startsWith(href + "/") &&
          (pathname === other.href || pathname.startsWith(other.href + "/"))
      )
    },
    [pathname]
  )
}

function SidebarNav({
  collapsed,
  lowStockCount,
  onNavigate,
}: {
  collapsed: boolean
  lowStockCount: number
  onNavigate?: () => void
}) {
  const isActiveItem = useActiveItem()

  return (
    <ScrollArea className="flex-1 py-3">
      <nav className="flex flex-col gap-4 px-2">
        {navGroups.map((group, gi) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed && (
              <span className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 select-none">
                {group.label}
              </span>
            )}
            {collapsed && gi > 0 && (
              <div className="my-1 mx-auto h-px w-6 bg-sidebar-border" />
            )}
            {group.items.map((item) => {
              const isActive = isActiveItem(item.href)
              const Icon = item.icon

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "relative flex size-9 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-brand-teal-glow text-brand-teal border-l-2 border-brand-teal"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                        {item.href === "/estoque" && lowStockCount > 0 && (
                          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-brand-coral" />
                        )}
                        <span className="sr-only">{item.title}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                    isActive
                      ? "border-l-2 border-brand-teal bg-brand-teal-glow text-brand-teal font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.href === "/estoque" && lowStockCount > 0 && (
                    <span className="ml-auto size-1.5 rounded-full bg-brand-coral shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
}

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  companyName?: string
  lowStockCount?: number
  mobileOpen: boolean
  onMobileClose: () => void
}

function SidebarLogo({ companyName, onClick }: { companyName?: string; onClick?: () => void }) {
  return (
    <Link href="/dashboard" onClick={onClick} className="flex items-center gap-2 overflow-hidden">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-brand-ink shadow-sm">
        <Zap className="size-4" />
      </div>
      <span className="truncate font-display font-bold text-sm text-sidebar-foreground tracking-wide">
        {companyName ?? "ScooterGestor"}
      </span>
    </Link>
  )
}

export function AppSidebar({
  collapsed,
  onToggle,
  companyName,
  lowStockCount = 0,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <TooltipProvider>
      {/* Desktop — sidebar flutuante, sempre visível a partir de xl (1280px) */}
      <aside
        className={cn(
          "my-4 ml-4 hidden flex-col rounded-2xl border border-sidebar-border bg-sidebar/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md transition-[width] duration-300 ease-in-out xl:flex",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <SidebarLogo companyName={collapsed ? undefined : companyName} />
        </div>

        <SidebarNav collapsed={collapsed} lowStockCount={lowStockCount} />

        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="size-9 w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
          </Button>
        </div>
      </aside>

      {/* Tablet (768–1279px) — drawer acionado pelo hambúrguer do AppHeader */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64 flex-col bg-sidebar shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
              <SidebarLogo companyName={companyName} onClick={onMobileClose} />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-sidebar-foreground"
                onClick={onMobileClose}
              >
                <X className="size-4" />
                <span className="sr-only">Fechar menu</span>
              </Button>
            </div>
            <SidebarNav collapsed={false} lowStockCount={lowStockCount} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </TooltipProvider>
  )
}
```

- [ ] **Step 3: Reescrever `components/layout/app-header.tsx`**

```tsx
"use client"

import * as React from "react"
import { Search, LogOut, Settings, ChevronDown, User, Sun, Moon, Menu } from "lucide-react"
import { useTransition } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS } from "@/lib/constants"
import { logoutAction } from "@/lib/actions/auth"
import type { Profile } from "@/types/app"
import { NotificationBell } from "@/components/layout/notification-bell"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="size-9" />

  const isDark = theme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

interface AppHeaderProps {
  profile?: Profile | null
  onMenuClick: () => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function AppHeader({ profile, onMenuClick }: AppHeaderProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <header className="mx-4 mt-4 flex h-14 shrink-0 items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 xl:hidden"
        onClick={onMenuClick}
      >
        <Menu className="size-4" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar clientes, OS, produtos..."
          className="pl-9 h-9 bg-muted/40 border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/70"
        />
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <ThemeToggle />
        <NotificationBell />

        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-muted/60"
              >
                <Avatar className="size-7 ring-2 ring-primary/20">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none max-w-[110px] truncate">
                    {profile.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </span>
                </div>
                <ChevronDown className="size-3 text-muted-foreground hidden sm:block ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-2.5 py-0.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{profile.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/configuracoes/empresa" className="flex items-center gap-2">
                  <Settings className="size-4" />
                  Configurações
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isPending}
                onSelect={() => startTransition(() => logoutAction())}
                className="flex items-center gap-2"
              >
                <LogOut className="size-4" />
                {isPending ? "Saindo..." : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!profile && (
          <Button variant="ghost" size="icon" className="size-9">
            <User className="size-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Criar `components/layout/app-bottom-nav.tsx`**

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wrench, Users, Boxes, Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const mainItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Oficina", href: "/oficina", icon: Wrench },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Estoque", href: "/estoque", icon: Boxes },
]

const moreItems = [
  { title: "Vendas", href: "/vendas" },
  { title: "Orçamentos", href: "/oficina/orcamentos" },
  { title: "Garantias", href: "/garantias" },
  { title: "Caixa", href: "/caixa" },
  { title: "Financeiro", href: "/financeiro" },
  { title: "Relatórios", href: "/relatorios" },
  { title: "Fornecedores", href: "/fornecedores" },
  { title: "Configurações", href: "/configuracoes" },
]

interface AppBottomNavProps {
  lowStockCount?: number
}

export function AppBottomNav({ lowStockCount = 0 }: AppBottomNavProps) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/90 px-2 py-1.5 backdrop-blur-xl md:hidden"
      aria-label="Navegação principal"
    >
      {mainItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] transition-transform active:scale-[0.92]",
              active ? "text-brand-teal" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <Icon className="size-5" fill={active ? "currentColor" : "none"} />
              {item.href === "/estoque" && lowStockCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brand-coral" />
              )}
            </span>
            {item.title}
            {active && <span className="mt-0.5 size-1 rounded-full bg-brand-teal" />}
          </Link>
        )
      })}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground transition-transform active:scale-[0.92]"
          >
            <Menu className="size-5" />
            Mais
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 p-4 pt-0">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground hover:border-brand-teal"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (fecha os erros pendentes das Tasks 4 e 5).

- [ ] **Step 6: Verificação visual manual**

Run: `npm run dev` e abrir `http://localhost:3000/dashboard` logado.

Confirmar em três larguras de janela (usar DevTools → responsive mode):
- **1440px:** sidebar e header flutuantes (margem da borda, cantos arredondados, leve blur), item ativo com glow teal.
- **900px:** sidebar desktop some; botão hambúrguer aparece no header; clicar nele abre o drawer com overlay escurecido; clicar fora ou num item fecha o drawer.
- **390px:** header sem busca (já era assim antes); bottom nav fixa aparece com 5 itens; tocar "Mais" abre o Sheet de baixo pra cima com o resto dos itens; navegar fecha o Sheet.

- [ ] **Step 7: Commit**

```bash
git add components/ui/sheet.tsx components/layout/app-sidebar.tsx components/layout/app-header.tsx components/layout/app-bottom-nav.tsx
git commit -m "feat: shell flutuante com drawer tablet e bottom nav mobile"
```

---

### Task 7: Camada de dados do dashboard — agregação diária e novas queries

**Files:**
- Create: `lib/dashboard-charts.ts`

**Interfaces:**
- Produces: `bucketByDay<T>(items: T[], getDate: (item: T) => string, getValue: (item: T) => number, days: number, endDate?: Date): { date: string; total: number }[]` — usado pela Task 9 pra montar tanto o sparkline de 7 dias quanto o gráfico de 30 dias a partir do mesmo array de pagamentos, e a série diária de OS criadas.

- [ ] **Step 1: Criar `lib/dashboard-charts.ts`**

```ts
export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number,
  days: number,
  endDate: Date = new Date()
): { date: string; total: number }[] {
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }

  for (const item of items) {
    const key = getDate(item).slice(0, 10)
    if (key in buckets) buckets[key] += getValue(item)
  }

  return Object.entries(buckets).map(([date, total]) => ({ date, total }))
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add lib/dashboard-charts.ts
git commit -m "feat: helper de agregacao diaria para os graficos do dashboard"
```

---

### Task 8: Componentes visuais do dashboard (bento tile, chip, gráfico, contador)

**Files:**
- Create: `components/dashboard/use-count-up.ts`
- Create: `components/dashboard/kpi-tile.tsx`
- Create: `components/dashboard/metric-chip.tsx`
- Create: `components/dashboard/revenue-chart.tsx`

**Interfaces:**
- Consumes: `bucketByDay` não é usado diretamente aqui (é usado na Task 9); estes componentes recebem os dados já agregados.
- Produces: `useCountUp(target: number, durationMs?: number): number`; `KpiTile({ title, numericValue, format?, icon, href?, sparkline?, size?, className? })`; `MetricChip({ label, value, icon, href?, tone? })`; `RevenueChart({ data: { date: string; total: number }[] })`.

- [ ] **Step 1: Criar `components/dashboard/use-count-up.ts`**

```ts
"use client"

import { useEffect, useState } from "react"
import { animate, useReducedMotion } from "framer-motion"

export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target)
      return
    }
    const controls = animate(0, target, {
      duration: durationMs / 1000,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [target, durationMs, prefersReducedMotion])

  return value
}
```

- [ ] **Step 2: Criar `components/dashboard/kpi-tile.tsx`**

```tsx
"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { useCountUp } from "./use-count-up"
import type { LucideIcon } from "lucide-react"

interface KpiTileProps {
  title: string
  numericValue: number
  format?: (n: number) => string
  icon: LucideIcon
  href?: string
  sparkline?: number[]
  size?: "hero" | "default"
  className?: string
}

export function KpiTile({
  title,
  numericValue,
  format = (n) => String(Math.round(n)),
  icon: Icon,
  href,
  sparkline,
  size = "default",
  className,
}: KpiTileProps) {
  const animated = useCountUp(numericValue)
  const isHero = size === "hero"
  const chartData = (sparkline ?? []).map((value, i) => ({ i, value }))

  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-200",
        !isHero && "min-h-[140px] hover:border-brand-teal hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--brand-teal-glow)]",
        isHero && "min-h-[220px] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3),0_0_24px_var(--brand-teal-glow)]",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <Icon className={cn("shrink-0 text-brand-teal", isHero ? "size-6" : "size-5")} aria-hidden="true" />
      </div>

      <p className={cn("font-mono font-medium tabular-nums text-foreground", isHero ? "text-4xl" : "text-2xl")}>
        {format(animated)}
      </p>

      {chartData.length > 0 && (
        <div className={isHero ? "-mx-2 h-16" : "-mx-1 h-8"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-teal)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brand-teal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--brand-teal)"
                strokeWidth={1.5}
                fill={`url(#spark-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {href && (
        <ArrowUpRight className="absolute bottom-3 right-3 size-3.5 text-brand-teal opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
```

- [ ] **Step 3: Criar `components/dashboard/metric-chip.tsx`**

```tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricChipProps {
  label: string
  value: string
  icon: LucideIcon
  href?: string
  tone?: "default" | "positive" | "negative"
}

const toneClass: Record<NonNullable<MetricChipProps["tone"]>, string> = {
  default: "text-muted-foreground",
  positive: "text-emerald-500",
  negative: "text-brand-coral",
}

export function MetricChip({ label, value, icon: Icon, href, tone = "default" }: MetricChipProps) {
  const content = (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-brand-teal">
      <Icon className={cn("size-4 shrink-0", toneClass[tone])} aria-hidden="true" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
```

- [ ] **Step 4: Criar `components/dashboard/revenue-chart.tsx`**

```tsx
"use client"

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
  data: { date: string; total: number }[]
}

function fmtShort(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "BRL",
  }).format(n)
}

function fmtDateShort(iso: string) {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDateShort}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => fmtDateShort(String(v))}
            formatter={(value: number) => [fmtShort(value), "Faturamento"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--brand-teal)"
            strokeWidth={2}
            fill="url(#revenue-gradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/
git commit -m "feat: componentes do dashboard em bento grid (kpi tile, chip, grafico, contador)"
```

---

### Task 9: Reescrever `/dashboard` no novo layout bento

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `bucketByDay` (Task 7); `KpiTile`, `MetricChip`, `RevenueChart` (Task 8).

- [ ] **Step 1: Substituir todo o conteúdo de `app/(app)/dashboard/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { MetricChip } from "@/components/dashboard/metric-chip"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { bucketByDay } from "@/lib/dashboard-charts"
import {
  DollarSign, ShoppingCart, Wrench, AlertTriangle,
  Users, CheckCircle, Clock, ArrowRight,
  Plus, CreditCard, Banknote, Smartphone,
} from "lucide-react"

const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", cash: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Débito", debit_card: "Débito",
  cartao_credito: "Crédito", credit_card: "Crédito",
  boleto: "Boleto", bank_slip: "Boleto",
  payment_link: "Link", misto: "Misto", outro: "Outro",
}

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  pix: Smartphone,
  dinheiro: Banknote,
  cash: Banknote,
}

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, normal: 2, baixa: 3 }

function methodIcon(method: string) {
  return METHOD_ICONS[method] ?? CreditCard
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

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
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed")
      .eq("company_id", cid)
      .gte("paid_at", todayStr),
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed")
      .eq("company_id", cid)
      .gte("paid_at", monthStart),
    supabase
      .from("payments")
      .select("id, amount, method, paid_at, sale_id, service_order_id, service_orders(order_number, customers(name)), sales(sale_number, customers(name))")
      .eq("company_id", cid)
      .order("paid_at", { ascending: false })
      .limit(8),
    supabase
      .from("service_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cid)
      .is("delivered_at", null),
    supabase
      .from("products")
      .select("stock_quantity, minimum_stock")
      .eq("company_id", cid)
      .eq("status", "active"),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cid),
    supabase
      .from("service_orders")
      .select("id, service_order_statuses!inner(slug)", { count: "exact", head: true })
      .eq("company_id", cid)
      .eq("service_order_statuses.slug", "aguardando-aprovacao"),
    supabase
      .from("service_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cid)
      .gte("completed_at", todayStr),
    supabase
      .from("service_orders")
      .select("id, order_number, priority, reported_problem, created_at, customers(name), service_order_statuses(name, color)")
      .eq("company_id", cid)
      .is("delivered_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("sales")
      .select("id, sale_number, total, created_at, customers(name)")
      .eq("company_id", cid)
      .eq("status", "concluida")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("payments")
      .select("amount, fee_amount, fee_absorbed, paid_at")
      .eq("company_id", cid)
      .gte("paid_at", thirtyDaysAgoStr),
    supabase
      .from("service_orders")
      .select("created_at")
      .eq("company_id", cid)
      .gte("created_at", sevenDaysAgoStr),
    supabase
      .from("sales")
      .select("customer_id")
      .eq("company_id", cid)
      .eq("status", "concluida")
      .gte("created_at", monthStart)
      .not("customer_id", "is", null),
    supabase
      .from("service_orders")
      .select("customer_id")
      .eq("company_id", cid)
      .gte("created_at", monthStart)
      .not("customer_id", "is", null),
  ])

  const netAmount = (p: any) => (p.amount ?? 0) - ((p as any).fee_absorbed ? ((p as any).fee_amount ?? 0) : 0)
  const todayRevenue = (todayPayments ?? []).reduce((s, p) => s + netAmount(p), 0)
  const monthRevenue = (monthPayments ?? []).reduce((s, p) => s + netAmount(p), 0)
  const lowStockCount = (lowStockProducts ?? []).filter(
    (p) => p.stock_quantity <= p.minimum_stock
  ).length

  const monthCustomerIds = new Set<string>([
    ...(monthSales ?? []).map((s: any) => s.customer_id as string),
    ...(monthOs ?? []).map((o: any) => o.customer_id as string),
  ])

  const revenue30d = bucketByDay(thirtyDayPayments ?? [], (p: any) => p.paid_at, (p) => netAmount(p), 30, now)
  const revenue7d = revenue30d.slice(-7)
  const osCreated7d = bucketByDay(sevenDayOsCreated ?? [], (o: any) => o.created_at, () => 1, 7, now)

  const sortedRecentOs = [...(recentOs ?? [])]
    .sort((a: any, b: any) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Dashboard" description="Visão geral da sua loja" />
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/oficina/nova">
              <Plus className="size-3.5 mr-1" /> Nova OS
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/vendas/nova">
              <Plus className="size-3.5 mr-1" /> Nova Venda
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/clientes/novo">
              <Plus className="size-3.5 mr-1" /> Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Bento hero: 4 KPIs principais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-2">
        <KpiTile
          size="hero"
          className="col-span-2 row-span-2"
          title="Faturamento do Mês"
          numericValue={monthRevenue}
          format={fmt}
          icon={DollarSign}
          href="/relatorios"
          sparkline={revenue7d.map((d) => d.total)}
        />
        <KpiTile
          title="OS Abertas"
          numericValue={openOsCount ?? 0}
          icon={Wrench}
          href="/oficina"
          sparkline={osCreated7d.map((d) => d.total)}
        />
        <KpiTile
          title="Estoque Baixo"
          numericValue={lowStockCount}
          icon={AlertTriangle}
          href="/estoque"
        />
        <KpiTile
          title="Clientes Atendidos no Mês"
          numericValue={monthCustomerIds.size}
          icon={Users}
          href="/clientes"
        />
      </div>

      {/* Gráfico de faturamento + OS recentes priorizadas */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="border-border/60 shadow-xs lg:col-span-8">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Faturamento — últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <RevenueChart data={revenue30d} />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">OS recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
              <Link href="/oficina" className="flex items-center gap-1">
                Ver todas <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {sortedRecentOs.length === 0 ? (
              <EmptyState icon={Wrench} title="Nenhuma OS aberta" description="Crie uma para acompanhar diagnóstico e manutenção." className="py-10" />
            ) : (
              <div className="divide-y divide-border/60">
                {sortedRecentOs.map((os: any) => (
                  <Link key={os.id} href={`/oficina/${os.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-medium">{os.order_number}</span>
                        {os.service_order_statuses && (
                          <StatusBadge label={os.service_order_statuses.name} color={os.service_order_statuses.color} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {os.customers?.name}{os.reported_problem && ` — ${os.reported_problem.slice(0, 40)}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-3 shrink-0 tabular-nums">{fmtDate(os.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas vendas + métricas secundárias compactas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Últimas vendas</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
              <Link href="/vendas" className="flex items-center gap-1">
                Ver todas <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {(!recentSales || recentSales.length === 0) ? (
              <EmptyState icon={ShoppingCart} title="Nenhuma venda realizada" description="Registre vendas para acompanhar seu faturamento aqui." className="py-10" />
            ) : (
              <div className="divide-y divide-border/60">
                {recentSales.map((s: any) => (
                  <Link key={s.id} href={`/vendas/${s.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{s.sale_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.customers?.name ?? "Venda sem cliente"}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-mono text-sm font-semibold text-emerald-600 tabular-nums">{fmt(s.total)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{fmtDate(s.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold font-display">Resumo do dia</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-2">
            <MetricChip label="Faturado hoje" value={fmt(todayRevenue)} icon={DollarSign} href="/relatorios" tone={todayRevenue > 0 ? "positive" : "default"} />
            <MetricChip label="Total de clientes" value={String(customerCount ?? 0)} icon={Users} href="/clientes" />
            <MetricChip label="Aguard. aprovação" value={String(waitingApprovalCount ?? 0)} icon={Clock} href="/oficina" tone={waitingApprovalCount ? "negative" : "default"} />
            <MetricChip label="OS concluídas hoje" value={String(completedTodayCount ?? 0)} icon={CheckCircle} href="/oficina" tone="positive" />
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <div>
            <CardTitle className="text-base font-semibold font-display">Pagamentos recentes</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos recebimentos registrados</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7 px-2 hover:text-primary">
            <Link href="/relatorios" className="flex items-center gap-1">
              Ver relatórios <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {(!recentPayments || recentPayments.length === 0) ? (
            <EmptyState icon={CreditCard} title="Nenhum pagamento registrado" description="Os pagamentos de OS e vendas aparecerão aqui." className="py-10" />
          ) : (
            <div className="divide-y divide-border/60">
              {recentPayments.map((p: any) => {
                const os = p.service_orders
                const sale = p.sales
                const isOs = !!p.service_order_id
                const customerName = isOs ? os?.customers?.name : sale?.customers?.name
                const ref = isOs ? os?.order_number : sale?.sale_number
                const href = isOs ? `/oficina/${p.service_order_id}` : `/vendas/${p.sale_id}`
                const Icon = methodIcon(p.method)
                return (
                  <Link
                    key={p.id}
                    href={href ?? "#"}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {customerName ?? "—"}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${isOs ? "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300" : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"}`}
                        >
                          {isOs ? "OS" : "Venda"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ref && `${ref} · `}{METHOD_LABELS[p.method] ?? p.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold text-emerald-600 tabular-nums">
                        {fmt(p.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {fmtDateTime(p.paid_at)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: sem erros novos introduzidos por este arquivo.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/dashboard/page.tsx"
git commit -m "feat: dashboard em bento grid com sparklines, grafico de 30 dias e novas metricas"
```

---

### Task 10: Verificação manual completa

**Files:** nenhum (só verificação).

- [ ] **Step 1: Rodar o build de produção**

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 2: Subir o servidor e verificar o dashboard**

Run: `npm run dev`, abrir `http://localhost:3000/dashboard` logado.

Checklist:
- Tile hero de Faturamento do Mês aparece 2×2, glow permanente, sparkline visível, número conta de 0 até o valor ao carregar.
- 3 tiles menores com sparkline (exceto Estoque Baixo, que não tem histórico — sem sparkline é o esperado, não é um bug).
- Gráfico de 30 dias renderiza com área gradiente teal e tooltip ao passar o mouse.
- "OS recentes" mostra as urgentes/altas no topo (criar/editar uma OS pra `urgente` no banco de teste e confirmar que ela sobe pro topo da lista).
- Chips de "Resumo do dia" mostram os 4 valores (Faturado hoje, Total clientes, Aguard. aprovação, OS concluídas hoje).
- "Últimas vendas" e "Pagamentos recentes" continuam funcionando como antes.

- [ ] **Step 3: Verificar os dois temas**

No dropdown do header, alternar claro/escuro — confirmar que ambos usam a paleta teal/ink nova (não a navy/azul antiga) e que o texto tem contraste legível nos dois.

- [ ] **Step 4: Verificar breakpoints**

Redimensionar pra 1440px, 900px e 390px (ou usar o responsive mode do DevTools) — sidebar/header flutuantes no desktop, drawer no tablet, bottom nav no mobile, bento grid empilhando em 2 colunas no mobile e 1 coluna pro tile hero.

- [ ] **Step 5: Verificar isolamento**

Navegar para `/`, `/login` e `/admin` (se tiver acesso de admin) — confirmar visualmente que continuam com a paleta navy/azul e fontes Syne/Outfit antigas, sem nenhum resquício do teal/ink.

- [ ] **Step 6: Verificar `prefers-reduced-motion`**

Ativar "reduzir movimento" nas configurações do SO (ou emular via DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion`), recarregar `/dashboard` — confirmar que os contadores dos KPIs aparecem direto no valor final (sem animação) e que não há transição de fade/slide ao navegar entre páginas do app.

- [ ] **Step 7: Commit final (se algum ajuste for necessário durante a verificação)**

```bash
git add -A
git commit -m "fix: ajustes de verificacao manual do redesign do dashboard"
```

(Só necessário se algo precisar de correção — se tudo passar de primeira, não há o que commitar nesta task.)
