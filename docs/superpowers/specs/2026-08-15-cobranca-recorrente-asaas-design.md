# Cobrança recorrente via Asaas + bloqueio de trial

## Contexto

Hoje o onboarding (`create_company_with_owner`,
`supabase/migrations/20260530000001_auth_functions.sql`) cria toda empresa
com `status = 'trial'` e `trial_ends_at = now() + 14 dias`, mas nada no
sistema verifica esse prazo. O `middleware.ts` só cuida de sessão
(`lib/supabase/proxy.ts`); não existe checagem de trial vencido em lugar
nenhum. Resultado: uma empresa fica em trial indefinidamente, pagando ou
não, até alguém editar `companies.status` direto no banco. Foi assim que um
cliente que já paga (combinado por fora) ficou 2 meses "em trial" sem o
sistema saber.

Não existe hoje nenhuma integração de gateway de pagamento no projeto —
nem Stripe, nem Asaas, nem Mercado Pago. As colunas `subscription_status` e
`subscription_current_period_end` já existem em `companies`
(`20260530000000_initial_schema.sql`) mas nenhum código as popula.

O plano comercial foi simplificado recentemente para um único plano —
Pro, R$147/mês (`lib/plans.ts`, `PLAN_CONFIGS.pro`) — o que torna a
cobrança recorrente mais simples: não há upgrade/downgrade de plano a
tratar, só "pago" ou "não pago".

## Problema

Construir a integração de cobrança recorrente com o Asaas de forma que:

1. Toda empresa nasce em trial (comportamento atual, sem mudança).
2. Quando o trial vence sem pagamento confirmado, o acesso ao app é
   bloqueado e o usuário é direcionado para pagar.
3. O pagamento acontece no checkout hospedado pelo próprio Asaas (PIX ou
   cartão) — sem o ScooterGestor tocar em dado de cartão.
4. A confirmação de pagamento (via webhook do Asaas) libera o acesso
   automaticamente, sem intervenção manual.
5. Um atraso de pagamento em um ciclo seguinte tem 2-3 dias de tolerância
   antes de bloquear de novo.
6. Continua existindo uma saída manual no `/admin` para ativar/suspender
   uma empresa sem depender do Asaas (pagamento combinado por fora,
   cortesia, ou contorno de problema pontual).

## Solução

### A) Novas colunas em `companies`

Migration nova:

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS asaas_customer_id     text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_overdue_since  timestamptz;
```

Os campos já existentes (`status`, `subscription_status`,
`subscription_current_period_end`, `trial_ends_at`) continuam sendo
usados, sem migration adicional para eles. Não há tabela de histórico de
pagamentos nesta fase — o histórico fica no próprio painel do Asaas
(YAGNI: nada no produto hoje precisa listar pagamentos passados).

### B) Cliente Asaas (`lib/asaas.ts`)

Wrapper fino sobre a REST API do Asaas (`fetch`, sem SDK), com três
funções:

- `createAsaasCustomer({ name, email, cpfCnpj? })` → `POST /customers`,
  retorna o `id` do cliente Asaas.
- `createAsaasSubscription({ customerId, externalReference, value })` →
  `POST /subscriptions` com `billingType: "UNDEFINED"` (deixa o Asaas
  oferecer PIX e cartão no checkout), `cycle: "MONTHLY"`,
  `value: 147`, `externalReference` = `company.id` (é assim que o
  webhook casa o evento com a empresa certa). Retorna `id` da assinatura
  e a URL do checkout hospedado (`invoiceUrl` do primeiro pagamento
  gerado, obtida via `GET /payments?subscription={id}` logo depois de
  criar).
- `getAsaasSubscription(id)` → usado só para depuração manual /
  eventual reconciliação futura; não é chamado no fluxo principal.

Variáveis de ambiente novas (adicionar ao `.env.example`):

```
ASAAS_API_KEY=
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=
```

Em produção, `ASAAS_BASE_URL=https://api.asaas.com/v3`. O `ASAAS_API_KEY`
é gerado no painel do Asaas (Configurações → Integrações → API Key). O
`ASAAS_WEBHOOK_TOKEN` é um segredo próprio nosso (qualquer string
aleatória), configurado tanto no `.env` quanto no cadastro do webhook no
painel do Asaas (campo "Token de autenticação"), usado para validar que a
requisição realmente veio de lá.

### C) Gate de acesso em `app/(app)/layout.tsx`

Depois de carregar `company` (já faz isso hoje, linha ~24), calcula:

```ts
const now = new Date()
const trialExpired = company.status === "trial" && new Date(company.trial_ends_at) < now
const overdueTooLong =
  company.payment_overdue_since &&
  now.getTime() - new Date(company.payment_overdue_since).getTime() > 3 * 24 * 60 * 60 * 1000
const blocked = company.status === "suspended" || trialExpired || overdueTooLong

if (blocked) redirect("/assinatura")
```

Nada é persistido nesse cálculo — é derivado a cada request, mesmo
padrão que já seria usado para o trial. Sem cron job.

A rota `/assinatura` vive fora de `app/(app)/`, num layout próprio e mais
simples (só precisa de `getAuthUser`/`getAuthProfile`, sem o gate acima —
senão vira loop de redirect).

### D) Banner de aviso (últimos 3 dias de trial)

Dentro de `AppShell` (`components/layout/app-shell.tsx`), quando
`company.status === "trial"` e faltam ≤ 3 dias para `trial_ends_at`,
mostra uma faixa fixa no topo: "Seu período de teste acaba em N dia(s).
Assine o plano Pro." com link para `/assinatura`. Sem estado de
"dispensar" persistido — some sozinho quando o status muda para `active`
ou quando o trial vence (aí vira bloqueio, não aviso).

### E) Página `/assinatura` + início do checkout

Nova rota `app/(assinatura)/assinatura/page.tsx` (grupo de rotas próprio,
fora de `(app)`), mostrando:

- Se `status === "active"` e não bloqueada: dados da assinatura atual
  (reaproveita a lógica hoje em `app/(app)/configuracoes/plano/page.tsx`
  — considerar linkar as duas telas em vez de duplicar).
- Se bloqueada: "Assine o Pro — R$147/mês" + botão "Ir para pagamento".

O botão dispara uma server action nova, `lib/actions/billing.ts` →
`startSubscriptionAction()`:

1. Busca a empresa do usuário autenticado (`getCtx()`, mesmo padrão dos
   outros arquivos em `lib/actions/`).
2. Se `asaas_customer_id` for nulo, chama `createAsaasCustomer` e
   grava o id retornado.
3. Se `asaas_subscription_id` for nulo, chama `createAsaasSubscription`
   com `externalReference = company.id` e grava o id retornado.
4. Busca o link de checkout do primeiro pagamento da assinatura e
   retorna `{ checkoutUrl }` para o client redirecionar
   (`window.location.href`, já que é um domínio externo — não dá para
   usar `redirect()` do Next para fora do app da mesma forma
   transparente, mais simples resolver no client).

Se a empresa já tiver `asaas_subscription_id` (ex.: está apenas atrasada,
não é a primeira vez), o botão busca o link de pagamento da cobrança em
aberto atual em vez de criar assinatura nova.

O desbloqueio **não depende do retorno do checkout** — só o webhook (item
F) libera de fato. O usuário pode fechar a aba do Asaas sem pagar e nada
muda até o pagamento ser confirmado.

### F) Webhook (`app/api/webhooks/asaas/route.ts`)

Rota pública `POST`. Usa `createAdminClient()`
(`lib/supabase/admin.ts`, já existe, service role) para escrever sem
depender de sessão.

1. Valida o header `asaas-access-token` contra
   `process.env.ASAAS_WEBHOOK_TOKEN`. Se não bater, `401` e retorna sem
   tocar no banco.
2. Lê `event` e `payment.subscription` / `payment.externalReference` do
   corpo.
3. Busca a empresa por `asaas_subscription_id = payment.subscription`
   (fallback: por `id = payment.externalReference`, caso a assinatura
   ainda não tenha sido persistida por algum motivo de corrida).
4. Se empresa não encontrada: loga e responde `200` (não é erro do
   Asaas, evita retentativa infinita do lado deles).
5. Em `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`:
   `status = 'active'`, `subscription_status = 'ACTIVE'`,
   `subscription_current_period_end = payment.nextDueDate`,
   `payment_overdue_since = null`.
6. Em `PAYMENT_OVERDUE`: só grava
   `payment_overdue_since = now()` **se ainda estiver `null`** (não
   resetar o relógio a cada novo evento de atraso do mesmo ciclo).
   `subscription_status = 'OVERDUE'`. Não mexe em `status` — quem decide
   bloquear é o gate (item C), depois de 3 dias.
7. Outros eventos (ex. `SUBSCRIPTION_DELETED`): ignora nesta fase (fora
   de escopo — ver abaixo).
8. Sempre responde `200` depois de processar, mesmo se o evento for de
   um tipo que a gente ignora — só erros de validação de token retornam
   status diferente de 200.

Idempotente: reprocessar o mesmo evento (reentrega do Asaas) não causa
efeito colateral duplicado, é só upsert de campos.

### G) Override manual no `/admin`

Em `app/(admin)/admin/[id]/page.tsx`, adiciona dois botões no card
"Informações da empresa": **Ativar manualmente** e **Suspender
manualmente**. Nova server action em `lib/actions/admin.ts`:

```ts
adminSetCompanyStatusAction(companyId: string, status: "active" | "suspended")
```

Roda com o client de sessão normal (`createClient()`), não
`createAdminClient()` — a RLS de `companies` já libera `UPDATE` para
`is_saas_admin()` (`20260530000000_initial_schema.sql`), então a checagem
de permissão fica no banco, não no código da action. Ativar manualmente
não mexe em `payment_overdue_since` nem cria nada no Asaas — é
puramente `status`. `revalidatePath("/admin/[id]", "page")` depois.

## Fora de escopo

- Upgrade/downgrade de plano (só existe um plano, Pro).
- Cancelamento de assinatura pelo próprio cliente dentro do app (hoje o
  texto em `/configuracoes/plano` já diz "entre em contato com o
  suporte" — continua assim).
- Tratar `SUBSCRIPTION_DELETED`/cancelamento feito direto no painel do
  Asaas — se acontecer, a empresa fica sem novo `PAYMENT_CONFIRMED` no
  próximo ciclo e cai em `OVERDUE` → bloqueio pela via normal, então
  funciona, mas sem um estado dedicado "cancelado" mais claro no admin.
- Tabela de histórico de pagamentos / recibos dentro do app.
- Reenvio de cobrança por WhatsApp quando atrasa (fica pro futuro, hoje
  o Asaas já manda cobrança por e-mail sozinho).
- Cron de reconciliação — o gate calcula tudo on-the-fly a cada request,
  sem job periódico.
- Migração de dados das 3 empresas já existentes — o usuário disse que
  vai marcar manualmente como `active` antes do deploy (fora do escopo
  de código desta spec).
- Ambiente de produção do Asaas — desenvolvimento e testes usam sandbox
  (`ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3`); trocar para
  produção é só variável de ambiente, sem mudança de código.

## Arquivos afetados

- `supabase/migrations/<nova>_add_asaas_billing_fields.sql` (nova)
- `lib/asaas.ts` (novo)
- `.env.example` — adiciona `ASAAS_API_KEY`, `ASAAS_BASE_URL`,
  `ASAAS_WEBHOOK_TOKEN`
- `app/(app)/layout.tsx` — gate de bloqueio
- `components/layout/app-shell.tsx` — banner de aviso de trial
- `app/(assinatura)/assinatura/layout.tsx` (novo, sem gate)
- `app/(assinatura)/assinatura/page.tsx` (novo)
- `lib/actions/billing.ts` (novo) — `startSubscriptionAction`
- `app/api/webhooks/asaas/route.ts` (novo)
- `app/(admin)/admin/[id]/page.tsx` — botões de override manual
- `lib/actions/admin.ts` (novo) — `adminSetCompanyStatusAction`

## Teste

Tudo em ambiente sandbox do Asaas (simula confirmação de pagamento pelo
próprio painel deles, sem PIX/cartão real):

1. Criar empresa de teste via onboarding normal, confirmar que continua
   nascendo em trial igual hoje.
2. Forçar `trial_ends_at` para o passado via SQL direto; recarregar o
   app logado nela e confirmar redirect para `/assinatura` com o
   bloqueio.
3. Clicar em "Ir para pagamento", confirmar que cria cliente + assinatura
   no Asaas (visível no painel sandbox) e redireciona para o checkout
   deles.
4. Confirmar o pagamento pelo painel sandbox do Asaas (ou disparar o
   webhook manualmente); confirmar que `companies.status` vira `active`
   e o app libera o acesso sem precisar deslogar/logar de novo.
5. Simular evento `PAYMENT_OVERDUE` via requisição manual ao endpoint do
   webhook (com o token correto); confirmar que `payment_overdue_since`
   é gravado mas o acesso **continua liberado** (dentro dos 3 dias).
6. Forçar `payment_overdue_since` para mais de 3 dias atrás via SQL;
   confirmar que o próximo acesso bloqueia e redireciona.
7. Testar os botões "Ativar manualmente" / "Suspender manualmente" no
   `/admin/[id]` e confirmar que o efeito aparece imediatamente no gate.
8. Testar o webhook com token inválido — confirmar `401` e que nenhum
   dado da empresa muda.
