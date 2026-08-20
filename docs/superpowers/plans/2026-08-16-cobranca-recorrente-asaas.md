# Cobrança Recorrente via Asaas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear automaticamente o acesso de empresas com trial vencido ou pagamento atrasado, e liberar o acesso automaticamente quando o pagamento é confirmado via checkout hospedado do Asaas (PIX/cartão), sem o ScooterGestor tocar em dado de cartão.

**Architecture:** Gate de acesso calculado on-the-fly a cada request em `app/(app)/layout.tsx` (sem cron, sem tabela de histórico). Um wrapper fino sobre a REST API do Asaas (`lib/asaas.ts`) cria cliente + assinatura e devolve a URL do checkout hospedado. Um webhook público (`app/api/webhooks/asaas/route.ts`), validado por token compartilhado, é a única via que libera o acesso — o retorno do checkout no navegador não libera nada por si. Um botão manual no `/admin` continua existindo como escape hatch independente do Asaas.

**Tech Stack:** Next.js (App Router, Server Actions, Route Handlers), Supabase (Postgres + RLS), fetch nativo para a REST API do Asaas (sandbox), TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-15-cobranca-recorrente-asaas-design.md`

## Global Constraints

- Plano único Pro, R$147/mês (`lib/plans.ts`, `PLAN_CONFIGS.pro.price === 147`) — não há upgrade/downgrade a tratar.
- Tolerância de atraso: bloqueia só depois de **3 dias** de `payment_overdue_since` não-nulo.
- Trial: 14 dias, já existente, sem mudança em `create_company_with_owner`.
- Sem cron — todo cálculo de bloqueio é derivado a cada request no gate.
- Sem tabela de histórico de pagamentos — o painel do Asaas é a fonte de verdade histórica.
- Checkout é sempre hospedado pelo Asaas (`billingType: "UNDEFINED"`) — nunca coletamos dado de cartão.
- Webhook sempre responde `200` após processar, mesmo para eventos ignorados — só token inválido retorna status diferente.
- **Este projeto não tem test runner configurado** (sem Jest/Vitest, sem `__tests__`, sem script `test` no `package.json`). Cada task abaixo termina em verificação manual (comando `curl`, SQL direto, ou clique na UI), não em suíte automatizada — segue o próprio plano de teste da spec (seção "Teste") e a convenção atual do repositório. Não introduza um test runner novo como parte deste plano.
- **Não há CLI do Supabase linkado neste repo** (sem `supabase/config.toml`). Migrations são aplicadas colando o SQL no SQL Editor do painel do Supabase — confirme com o usuário antes de aplicar em produção.
- As 3 empresas hoje cadastradas (trial) **não** são migradas automaticamente — o usuário marca manualmente como `active` antes do deploy (fora do escopo de código).

---

## Task 1: Colunas Asaas em `companies`

**Files:**
- Create: `supabase/migrations/20260816000001_add_asaas_billing_fields.sql`
- Modify: `types/database.ts` (bloco `companies.Row`, por volta da linha 6-27)

**Interfaces:**
- Produces: colunas `asaas_customer_id: string | null`, `asaas_subscription_id: string | null`, `payment_overdue_since: string | null` em `companies` — usadas por todas as tasks seguintes. O tipo `Company` (`types/app.ts:4`, `Tables<"companies"> & { plan: Plan }`) herda essas colunas automaticamente via `Tables<"companies">`.

- [ ] **Step 1: Criar a migration**

```sql
-- supabase/migrations/20260816000001_add_asaas_billing_fields.sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS asaas_customer_id     text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_overdue_since  timestamptz;
```

- [ ] **Step 2: Atualizar `types/database.ts`**

Em `types/database.ts`, dentro de `companies.Row` (linhas 7-27), adicionar as 3 colunas novas depois de `subscription_current_period_end`:

```ts
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          cnpj: string | null
          email: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          logo_url: string | null
          plan: string
          status: string
          subscription_status: string | null
          trial_ends_at: string | null
          subscription_current_period_end: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          payment_overdue_since: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>

        Relationships: never[]
      }
```

(`Insert`/`Update` são derivados de `Row` via `Omit`/`Partial`, então não precisam de edição própria.)

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem novos erros relacionados a `companies` (o projeto pode já ter erros pré-existentes em outras áreas — confirme que nenhum é introduzido por esta mudança).

- [ ] **Step 4: Aplicar a migration**

Cole o SQL do Step 1 no SQL Editor do painel do Supabase (projeto do ScooterGestor) e execute. Depois, confirme direto no painel (Table Editor → `companies`) que as 3 colunas novas existem.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260816000001_add_asaas_billing_fields.sql types/database.ts
git commit -m "feat: adiciona colunas Asaas em companies"
```

---

## Task 2: Cliente Asaas (`lib/asaas.ts`)

**Files:**
- Create: `lib/asaas.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `process.env.ASAAS_API_KEY`, `process.env.ASAAS_BASE_URL`.
- Produces (usados pelas Tasks 5 e 7):
  - `createAsaasCustomer(params: { name: string; email: string; cpfCnpj?: string }): Promise<{ id: string }>`
  - `createAsaasSubscription(params: { customerId: string; externalReference: string; value: number }): Promise<{ id: string; checkoutUrl: string }>`
  - `getOpenPaymentUrl(subscriptionId: string): Promise<string>`
  - `getAsaasSubscription(id: string): Promise<unknown>`

- [ ] **Step 1: Adicionar variáveis de ambiente ao `.env.example`**

```bash
# .env.example — adicionar ao final do arquivo existente
ASAAS_API_KEY=
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=
```

- [ ] **Step 2: Escrever `lib/asaas.ts`**

```ts
// lib/asaas.ts
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3"

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error("ASAAS_API_KEY is required")

  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export async function createAsaasCustomer(params: {
  name: string
  email: string
  cpfCnpj?: string
}): Promise<{ id: string }> {
  return asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export async function getOpenPaymentUrl(subscriptionId: string): Promise<string> {
  const payments = await asaasFetch<{ data: Array<{ invoiceUrl: string }> }>(
    `/payments?subscription=${subscriptionId}`
  )
  const payment = payments.data[0]
  if (!payment) throw new Error(`No payment found for subscription ${subscriptionId}`)
  return payment.invoiceUrl
}

export async function createAsaasSubscription(params: {
  customerId: string
  externalReference: string
  value: number
}): Promise<{ id: string; checkoutUrl: string }> {
  const subscription = await asaasFetch<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "UNDEFINED",
      cycle: "MONTHLY",
      value: params.value,
      nextDueDate: new Date().toISOString().slice(0, 10),
      externalReference: params.externalReference,
    }),
  })

  const checkoutUrl = await getOpenPaymentUrl(subscription.id)
  return { id: subscription.id, checkoutUrl }
}

export async function getAsaasSubscription(id: string): Promise<unknown> {
  return asaasFetch(`/subscriptions/${id}`)
}
```

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 4: Verificação manual (requer `ASAAS_API_KEY` de sandbox em `.env.local`)**

Se a chave sandbox já estiver disponível, rode um script pontual para confirmar a integração de ponta a ponta (apague depois, é só verificação — não faz parte do código do produto):

```bash
cat > /tmp/asaas-smoke-test.mjs << 'EOF'
import { createAsaasCustomer, createAsaasSubscription } from "../home/richard/www/projetos/scootergestor/lib/asaas.ts"
const customer = await createAsaasCustomer({ name: "Teste ScooterGestor", email: "teste@example.com" })
console.log("customer:", customer)
const sub = await createAsaasSubscription({ customerId: customer.id, externalReference: "test-company-id", value: 147 })
console.log("subscription:", sub)
EOF
```

Como o repo usa Next.js (sem `ts-node`/`tsx` instalado), a forma mais simples de validar é criar uma rota de teste temporária (`app/api/_debug-asaas/route.ts`) chamando as duas funções e retornando o JSON, acessá-la via `npm run dev` + `curl localhost:3000/api/_debug-asaas`, confirmar no painel sandbox do Asaas (aba Clientes / Assinaturas) que o cliente e a assinatura foram criados, e então **apagar a rota de debug** antes de commitar. Se a chave sandbox ainda não estiver disponível, marque este step como pendente e prossiga — as Tasks 5 e 6 dependem dela para teste completo, mas o código pode ser escrito e revisado sem ela.

- [ ] **Step 5: Commit**

```bash
git add lib/asaas.ts .env.example
git commit -m "feat: adiciona wrapper da API do Asaas"
```

---

## Task 3: Gate de acesso + rota `/assinatura` (esqueleto)

**Files:**
- Modify: `app/(app)/layout.tsx`
- Create: `app/(assinatura)/assinatura/layout.tsx`
- Create: `app/(assinatura)/assinatura/page.tsx` (placeholder — conteúdo completo vem na Task 5)

**Interfaces:**
- Consumes: `company.status`, `company.trial_ends_at`, `company.payment_overdue_since` (Task 1).
- Produces: rota `/assinatura` (fora do gate) para onde o gate redireciona. A Task 4 consome `trialDaysLeft` computado aqui (vai virar prop do `AppShell`, mas essa prop só é adicionada na Task 4 — nesta task, calcule o valor mas não passe a prop ainda, para não quebrar o build).

Na verdade, mais simples: calcule `trialDaysLeft` já nesta task e passe como prop no `<AppShell>` — a Task 4 só precisa consumir a prop no componente. Evita reabrir `layout.tsx` na Task 4.

- [ ] **Step 1: Editar o gate em `app/(app)/layout.tsx`**

Arquivo atual (`app/(app)/layout.tsx`, 50 linhas) — inserir a lógica de bloqueio logo depois do `if (!company) redirect("/onboarding")` (linha 33), e passar `trialDaysLeft` para `<AppShell>`:

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

  const now = new Date()
  const trialExpired =
    company.status === "trial" &&
    company.trial_ends_at !== null &&
    new Date(company.trial_ends_at) < now
  const overdueTooLong =
    company.payment_overdue_since !== null &&
    now.getTime() - new Date(company.payment_overdue_since).getTime() > 3 * 24 * 60 * 60 * 1000
  const blocked = company.status === "suspended" || trialExpired || overdueTooLong

  if (blocked) redirect("/assinatura")

  let trialDaysLeft: number | null = null
  if (company.status === "trial" && company.trial_ends_at) {
    const msLeft = new Date(company.trial_ends_at).getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000))
    if (daysLeft <= 3) trialDaysLeft = daysLeft
  }

  return (
    <AuthProvider
      profile={profile as Profile}
      company={company as Company}
    >
      <AppShell
        profile={profile as Profile}
        companyName={company.name}
        lowStockCount={lowStockCount ?? 0}
        trialDaysLeft={trialDaysLeft}
        fontVariables={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}
```

(A prop `trialDaysLeft` no `AppShell` ainda não existe — isso é esperado, será adicionada na Task 4. Se rodar `tsc` agora, vai reclamar de prop desconhecida; tudo bem, a Task 4 fecha isso. Se preferir manter cada task com `tsc` limpo, adicione `trialDaysLeft?: number | null` ao `AppShellProps` nesta mesma task, mesmo sem usá-la ainda no JSX — faça isso para não deixar o build quebrado entre tasks.)

Adicione `trialDaysLeft?: number | null` à interface `AppShellProps` em `components/layout/app-shell.tsx` (linhas 11-17) agora, sem ainda renderizar nada com ela (isso vem na Task 4):

```tsx
interface AppShellProps {
  children: React.ReactNode
  profile: Profile
  companyName?: string | null
  lowStockCount?: number
  trialDaysLeft?: number | null
  fontVariables: string
}
```

- [ ] **Step 2: Criar o layout de `/assinatura`**

```tsx
// app/(assinatura)/assinatura/layout.tsx
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"

export default async function AssinaturaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Criar o placeholder de `/assinatura`**

```tsx
// app/(assinatura)/assinatura/page.tsx
export default function AssinaturaPage() {
  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-xl font-bold">Assinatura</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Em breve: fluxo de pagamento.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual do bloqueio**

Com `npm run dev` rodando, logado em uma empresa de teste:

```sql
-- SQL Editor do Supabase, na empresa de teste
UPDATE companies SET trial_ends_at = now() - interval '1 day' WHERE id = '<id-da-empresa-de-teste>';
```

Recarregue qualquer página logada do app (`/dashboard`, etc.) e confirme que redireciona para `/assinatura` mostrando o placeholder, sem loop de redirect. Depois reverta:

```sql
UPDATE companies SET trial_ends_at = now() + interval '14 days' WHERE id = '<id-da-empresa-de-teste>';
```

Recarregue e confirme que volta a acessar o app normalmente.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/layout.tsx" "components/layout/app-shell.tsx" "app/(assinatura)/assinatura/layout.tsx" "app/(assinatura)/assinatura/page.tsx"
git commit -m "feat: adiciona gate de bloqueio de trial/atraso e rota /assinatura"
```

---

## Task 4: Banner de aviso de trial

**Files:**
- Modify: `components/layout/app-shell.tsx`

**Interfaces:**
- Consumes: prop `trialDaysLeft?: number | null` (já adicionada à interface na Task 3, passada pelo layout).

- [ ] **Step 1: Renderizar o banner**

Em `components/layout/app-shell.tsx`, importar `Link` de `next/link` e desestruturar `trialDaysLeft` nos props da função (linhas 19-25), depois renderizar o banner logo acima de `<main>` (linha 59), dentro da coluna flex que começa na linha 56:

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
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
  trialDaysLeft?: number | null
  fontVariables: string
}

export function AppShell({
  children,
  profile,
  companyName,
  lowStockCount = 0,
  trialDaysLeft = null,
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

        {trialDaysLeft !== null && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-300">
            <span>
              Seu período de teste acaba em {trialDaysLeft} dia{trialDaysLeft === 1 ? "" : "s"}.
            </span>
            <Link href="/assinatura" className="font-semibold underline underline-offset-2">
              Assine o plano Pro
            </Link>
          </div>
        )}

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

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual**

```sql
UPDATE companies SET trial_ends_at = now() + interval '2 days' WHERE id = '<id-da-empresa-de-teste>';
```

Recarregue o app logado e confirme que a faixa amarela aparece no topo com "Seu período de teste acaba em 2 dias." e o link leva para `/assinatura`. Depois:

```sql
UPDATE companies SET trial_ends_at = now() + interval '14 days' WHERE id = '<id-da-empresa-de-teste>';
```

Confirme que a faixa some.

- [ ] **Step 4: Commit**

```bash
git add components/layout/app-shell.tsx
git commit -m "feat: adiciona banner de aviso de trial no AppShell"
```

---

## Task 5: Página `/assinatura` + início do checkout

**Files:**
- Create: `lib/actions/billing.ts`
- Create: `components/billing/start-subscription-button.tsx`
- Modify: `app/(assinatura)/assinatura/page.tsx` (substitui o placeholder da Task 3)

**Interfaces:**
- Consumes: `createAsaasCustomer`, `createAsaasSubscription`, `getOpenPaymentUrl` (Task 2); `getPlanConfig` (`lib/plans.ts`, já existe); `Plan` (`lib/constants.ts`, já existe).
- Produces: `startSubscriptionAction(_prev: BillingActionState, _formData: FormData): Promise<BillingActionState>`, tipo `BillingActionState = { error?: string; checkoutUrl?: string }` — não consumido por nenhuma task seguinte.

- [ ] **Step 1: Escrever `lib/actions/billing.ts`**

```ts
// lib/actions/billing.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAsaasCustomer, createAsaasSubscription, getOpenPaymentUrl } from "@/lib/asaas"
import { getPlanConfig } from "@/lib/plans"
import type { Plan } from "@/lib/constants"

export type BillingActionState = { error?: string; checkoutUrl?: string }

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles").select("id, name, email, company_id").eq("user_id", user.id).single()
  if (!profile) return null

  const { data: company } = await supabase
    .from("companies").select("*").eq("id", profile.company_id).single()
  if (!company) return null

  return { supabase, profile, company }
}

export async function startSubscriptionAction(
  _prev: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  const ctx = await getCtx()
  if (!ctx) return { error: "Não autenticado" }

  const { supabase, profile, company } = ctx

  if (company.asaas_subscription_id) {
    try {
      const checkoutUrl = await getOpenPaymentUrl(company.asaas_subscription_id)
      return { checkoutUrl }
    } catch {
      return { error: "Não foi possível carregar o link de pagamento. Tente novamente." }
    }
  }

  try {
    let customerId = company.asaas_customer_id
    if (!customerId) {
      const customer = await createAsaasCustomer({ name: company.name, email: profile.email })
      customerId = customer.id
      await supabase.from("companies").update({ asaas_customer_id: customerId }).eq("id", company.id)
    }

    const plan = company.plan as Plan
    const config = getPlanConfig(plan)

    const subscription = await createAsaasSubscription({
      customerId,
      externalReference: company.id,
      value: config.price,
    })

    await supabase.from("companies").update({ asaas_subscription_id: subscription.id }).eq("id", company.id)

    return { checkoutUrl: subscription.checkoutUrl }
  } catch {
    return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
  }
}
```

- [ ] **Step 2: Escrever o botão client-side**

```tsx
// components/billing/start-subscription-button.tsx
"use client"

import * as React from "react"
import { useActionState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { startSubscriptionAction, type BillingActionState } from "@/lib/actions/billing"

const initialState: BillingActionState = {}

export function StartSubscriptionButton() {
  const [state, formAction, isPending] = useActionState(startSubscriptionAction, initialState)

  React.useEffect(() => {
    if (state.checkoutUrl) {
      window.location.href = state.checkoutUrl
    }
  }, [state.checkoutUrl])

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={isPending} className="w-full gap-2">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isPending ? "Preparando pagamento..." : "Ir para pagamento"}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Escrever a página `/assinatura` completa**

```tsx
// app/(assinatura)/assinatura/page.tsx
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPlanConfig } from "@/lib/plans"
import type { Plan } from "@/lib/constants"
import { StartSubscriptionButton } from "@/components/billing/start-subscription-button"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export default async function AssinaturaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const supabase = await createClient()
  const { data: company } = await supabase
    .from("companies").select("*").eq("id", profile.company_id).single()
  if (!company) redirect("/onboarding")

  const plan = company.plan as Plan
  const config = getPlanConfig(plan)

  const isBlocked =
    company.status === "suspended" ||
    (company.status === "trial" && company.trial_ends_at !== null && new Date(company.trial_ends_at) < new Date()) ||
    (company.payment_overdue_since !== null &&
      Date.now() - new Date(company.payment_overdue_since).getTime() > 3 * 24 * 60 * 60 * 1000)

  if (!isBlocked && company.status === "active") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Assinatura ativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Plano Pro — {formatCurrency(config.price)}/mês.</p>
          <p className="text-muted-foreground">
            Veja detalhes completos em{" "}
            <a href="/configuracoes/plano" className="font-medium underline underline-offset-2">
              Configurações → Plano
            </a>.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Assine o plano Pro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          {formatCurrency(config.price)}/mês — PIX ou cartão, no checkout seguro do Asaas.
        </p>
        <StartSubscriptionButton />
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual (requer `ASAAS_API_KEY` de sandbox)**

Com a empresa de teste bloqueada (repita o SQL do Task 3 Step 5 para forçar `trial_ends_at` no passado), acesse `/assinatura`, clique em "Ir para pagamento" e confirme:
- Redireciona para o checkout hospedado do Asaas (domínio `sandbox.asaas.com`).
- No painel sandbox do Asaas, o cliente e a assinatura aparecem criados.
- No banco, `companies.asaas_customer_id` e `asaas_subscription_id` foram preenchidos para a empresa de teste.

Feche a aba do Asaas sem pagar — confirme que recarregar o app continua bloqueando (o desbloqueio só acontece pelo webhook, Task 6).

- [ ] **Step 6: Commit**

```bash
git add lib/actions/billing.ts components/billing/start-subscription-button.tsx "app/(assinatura)/assinatura/page.tsx"
git commit -m "feat: adiciona pagina de assinatura e inicio do checkout Asaas"
```

---

## Task 6: Webhook do Asaas

**Files:**
- Create: `app/api/webhooks/asaas/route.ts`

**Interfaces:**
- Consumes: `createAdminClient` (`lib/supabase/admin.ts`, já existe), `process.env.ASAAS_WEBHOOK_TOKEN`.

- [ ] **Step 1: Escrever a rota**

```ts
// app/api/webhooks/asaas/route.ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type AsaasWebhookPayload = {
  event: string
  payment: {
    subscription?: string
    externalReference?: string
    nextDueDate?: string
  }
}

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token")
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 })
  }

  const payload = (await req.json()) as AsaasWebhookPayload
  const { event, payment } = payload

  const supabase = createAdminClient()

  let company: { id: string; payment_overdue_since: string | null } | null = null

  if (payment.subscription) {
    const { data } = await supabase
      .from("companies")
      .select("id, payment_overdue_since")
      .eq("asaas_subscription_id", payment.subscription)
      .maybeSingle()
    company = data
  }

  if (!company && payment.externalReference) {
    const { data } = await supabase
      .from("companies")
      .select("id, payment_overdue_since")
      .eq("id", payment.externalReference)
      .maybeSingle()
    company = data
  }

  if (!company) {
    console.error(
      `Asaas webhook: company not found (subscription=${payment.subscription ?? "?"}, externalReference=${payment.externalReference ?? "?"})`
    )
    return NextResponse.json({ ok: true })
  }

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    await supabase
      .from("companies")
      .update({
        status: "active",
        subscription_status: "ACTIVE",
        subscription_current_period_end: payment.nextDueDate ?? null,
        payment_overdue_since: null,
      })
      .eq("id", company.id)
  } else if (event === "PAYMENT_OVERDUE") {
    await supabase
      .from("companies")
      .update({
        subscription_status: "OVERDUE",
        payment_overdue_since: company.payment_overdue_since ?? new Date().toISOString(),
      })
      .eq("id", company.id)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual — token inválido**

Com `npm run dev` rodando:

```bash
curl -i -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: token-errado" \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"subscription":"sub_123"}}'
```

Expected: `HTTP/1.1 401`, e nenhuma linha em `companies` é alterada.

- [ ] **Step 4: Verificação manual — confirmação de pagamento**

Usando a empresa de teste da Task 5 (já com `asaas_subscription_id` preenchido), pegue o valor de `payment_overdue_since` antes e o `asaas_subscription_id` real:

```bash
curl -i -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: <valor de ASAAS_WEBHOOK_TOKEN no seu .env.local>" \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"subscription":"<asaas_subscription_id-da-empresa-teste>","nextDueDate":"2026-09-16"}}'
```

Expected: `HTTP/1.1 200`. Confira no banco que `companies.status = 'active'`, `subscription_status = 'ACTIVE'`, `subscription_current_period_end = '2026-09-16'`, `payment_overdue_since IS NULL` para a empresa de teste. Recarregue o app logado nela (sem deslogar) e confirme que o bloqueio some.

- [ ] **Step 5: Verificação manual — atraso e tolerância de 3 dias**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: <ASAAS_WEBHOOK_TOKEN>" \
  -d '{"event":"PAYMENT_OVERDUE","payment":{"subscription":"<asaas_subscription_id-da-empresa-teste>"}}'
```

Expected: `payment_overdue_since` gravado com o timestamp atual, `subscription_status = 'OVERDUE'`, mas o acesso ao app **continua liberado** (dentro dos 3 dias). Depois force o timestamp para mais de 3 dias atrás:

```sql
UPDATE companies SET payment_overdue_since = now() - interval '4 days' WHERE id = '<id-da-empresa-de-teste>';
```

Recarregue o app e confirme que agora bloqueia, redirecionando para `/assinatura`. Reenvie o evento `PAYMENT_OVERDUE` do Step 5 uma segunda vez e confirme que `payment_overdue_since` **não muda** (idempotência — só grava se estava nulo).

- [ ] **Step 6: Reverter estado de teste**

```sql
UPDATE companies
SET status = 'trial', trial_ends_at = now() + interval '14 days', payment_overdue_since = null, subscription_status = null
WHERE id = '<id-da-empresa-de-teste>';
```

- [ ] **Step 7: Commit**

```bash
git add app/api/webhooks/asaas/route.ts
git commit -m "feat: adiciona webhook do Asaas para liberar/marcar atraso de pagamento"
```

---

## Task 7: Override manual no `/admin`

**Files:**
- Create: `lib/actions/admin.ts`
- Create: `components/admin/admin-company-status-buttons.tsx`
- Modify: `app/(admin)/admin/[id]/page.tsx`

**Interfaces:**
- Produces: `adminSetCompanyStatusAction(companyId: string, status: "active" | "suspended"): Promise<ActionState>` — `ActionState` importado de `lib/actions/auth.ts` (`{ error?: string; success?: string }`, já existe).

- [ ] **Step 1: Escrever `lib/actions/admin.ts`**

```ts
// lib/actions/admin.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionState } from "./auth"

export async function adminSetCompanyStatusAction(
  companyId: string,
  status: "active" | "suspended"
): Promise<ActionState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", companyId)

  if (error) return { error: "Não foi possível atualizar o status da empresa" }

  revalidatePath("/admin/[id]", "page")
  return { success: status === "active" ? "Empresa ativada" : "Empresa suspensa" }
}
```

(Usa o client de sessão normal, não `createAdminClient()` — a RLS de `companies_update` já libera `UPDATE` para `is_saas_admin()`, então a checagem de permissão fica no banco.)

- [ ] **Step 2: Escrever os botões client-side**

```tsx
// components/admin/admin-company-status-buttons.tsx
"use client"

import * as React from "react"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { adminSetCompanyStatusAction } from "@/lib/actions/admin"

export function AdminCompanyStatusButtons({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleClick(status: "active" | "suspended") {
    setError(null)
    startTransition(async () => {
      const result = await adminSetCompanyStatusAction(companyId, status)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleClick("active")}>
          Ativar manualmente
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleClick("suspended")}>
          Suspender manualmente
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Adicionar os botões em `app/(admin)/admin/[id]/page.tsx`**

Dentro do card "Informações da empresa" (linhas 77-89 do arquivo atual), depois do `<CardContent>` existente, adicionar o import e o componente:

```tsx
import { AdminCompanyStatusButtons } from "@/components/admin/admin-company-status-buttons"
```

E dentro de `<CardContent className="text-sm space-y-2">` (linha 79), logo depois do bloco `{company.trial_ends_at && (...)}` (linhas 85-87), antes do fechamento de `</CardContent>` (linha 88):

```tsx
            <AdminCompanyStatusButtons companyId={company.id} />
```

- [ ] **Step 4: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual**

Acesse `/admin/<id-da-empresa-de-teste>` logado como saas-admin. Clique em "Suspender manualmente" — confirme que o badge de status no topo da página muda para "Suspenso" (após o `revalidatePath`, sem precisar recarregar manualmente) e que, ao acessar o app logado nessa empresa, o gate bloqueia (`status === "suspended"`). Clique em "Ativar manualmente" — confirme que o badge volta para "Ativo" e o acesso é liberado.

- [ ] **Step 6: Commit**

```bash
git add lib/actions/admin.ts components/admin/admin-company-status-buttons.tsx "app/(admin)/admin/[id]/page.tsx"
git commit -m "feat: adiciona ativar/suspender manual de empresa no admin"
```

---

## Pendências fora deste plano (confirmadas na spec como fora de escopo)

- Marcar manualmente as 3 empresas hoje trial (`Motox`, `teste1`, `MotoX`) como `active` — o usuário faz isso antes do deploy, via `/admin` (Task 7) ou SQL direto.
- Cadastrar `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` reais (sandbox) nas variáveis de ambiente do deploy, e registrar a URL do webhook (`https://<domínio>/api/webhooks/asaas`) + o mesmo `ASAAS_WEBHOOK_TOKEN` no painel do Asaas (Configurações → Webhooks).
- Troca de sandbox para produção no Asaas é só variável de ambiente (`ASAAS_BASE_URL`), sem mudança de código.
