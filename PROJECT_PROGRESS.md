# ScooterGestor — Progresso do Projeto

## Status Geral

| Fase | Status | Data |
|------|--------|------|
| FASE 0 — Diagnóstico | ✅ Concluída | 2026-05-30 |
| FASE 1 — Base do projeto | ✅ Concluída | 2026-05-30 |
| FASE 2 — Design system | ✅ Concluída | 2026-05-30 |
| FASE 3 — Landing page | ✅ Concluída | 2026-05-30 |
| FASE 4 — Supabase | ✅ Concluída | 2026-05-30 |
| FASE 5 — Autenticação | ✅ Concluída | 2026-05-30 |
| FASE 6 — Multiempresa | ✅ Concluída | 2026-05-30 |
| FASE 7 — Configurações | ✅ Concluída | 2026-05-30 |
| FASE 8 — Dashboard | ✅ Concluída | 2026-05-30 |
| FASE 9 — Clientes | ✅ Concluída | 2026-05-30 |
| FASE 10 — Produtos | ✅ Concluída | 2026-05-30 |
| FASE 11 — Estoque | ✅ Concluída | 2026-05-30 |
| FASE 12 — Vendas | ✅ Concluída | 2026-05-30 |
| FASE 13 — Oficina/OS | ✅ Concluída | 2026-05-30 |
| FASE 14 — Financeiro | ✅ Concluída | 2026-05-30 |
| FASE 15 — Relatórios | ✅ Concluída | 2026-05-30 |
| FASE 16 — Painel Admin | ✅ Concluída | 2026-05-30 |
| FASE 17 — Polimento | ✅ Concluída | 2026-05-30 |

---

## FASE 0 — Diagnóstico ✅

**Data**: 2026-05-30

**O que foi feito**:
- Analisada a pasta `/home/richard/www/projetos/`
- Confirmado que não existia projeto scootergestor
- Identificados 5 projetos existentes (não afetados)
- Verificadas versões: Node.js v20.20.2, npm 10.8.2
- Identificada stack de referência do projeto motox-rj

---

## FASE 1 — Base do Projeto ✅

**Data**: 2026-05-30

**Arquivos criados**:
- `package.json` (via create-next-app + dependências adicionais)
- `next.config.ts`
- `middleware.ts`
- `app/layout.tsx`
- `app/globals.css` (variáveis shadcn/ui, tema claro/escuro)
- `components.json` (shadcn/ui config, estilo new-york)
- `.env.example`
- `README.md`
- `PROJECT_PROGRESS.md`
- `lib/utils.ts`
- `lib/constants.ts`
- `lib/plans.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `types/database.ts`
- `types/app.ts`

**Estrutura de pastas criada**:
- Todas as rotas do app (public, auth, app, admin)
- Todos os módulos de components
- lib/, types/, hooks/, services/, supabase/migrations/, docs/

**Dependências instaladas**:
- next 16.2.6, react 19, typescript
- @supabase/supabase-js, @supabase/ssr
- react-hook-form, @hookform/resolvers, zod
- sonner, lucide-react, next-themes
- class-variance-authority, clsx, tailwind-merge, tw-animate-css
- @tanstack/react-table, recharts, date-fns
- Radix UI (dialog, dropdown, label, select, separator, slot, toast, tooltip, avatar, checkbox, switch, tabs, popover, scroll-area)

**Próximos passos**: FASE 2 — Design system (componentes shadcn/ui base)

---

## FASE 6 — Multiempresa ✅

**Data**: 2026-05-30

**O que foi feito**:

### Banco de dados
- `supabase/migrations/20260530000002_invitations.sql`
  - Tabela `company_invitations` com RLS (apenas owners/admins criam e cancelam)
  - Função `accept_invitation(p_token)` — SECURITY DEFINER: valida token, cria perfil, marca convite como aceito
  - Função `expire_old_invitations()` para limpeza periódica

### Tipos
- `types/database.ts` — adicionado `company_invitations` + `accept_invitation` / `expire_old_invitations` no Functions
- `types/app.ts` — adicionado `CompanyInvitation`

### Camada de aplicação
- `lib/supabase/admin.ts` — cliente Supabase com service role (para uso futuro em server actions críticas)
- `components/providers/auth-provider.tsx` — React Context com `profile`, `company`, flags de role (`isOwner`, `isAdmin`, `isManager`, ...) e helpers `hasFeature()` / `getLimit()`
- `lib/hooks/use-auth.ts` — hook `useAuth()` exportado do provider (mesmo arquivo)
- `components/auth/role-gate.tsx` — `<RoleGate roles={[...]}>` e `<FeatureGate feature="...">` para renderização condicional por role/plano

### Layout
- `app/(app)/layout.tsx` — agora busca empresa completa e envolve com `<AuthProvider>`

### Server actions
- `lib/actions/users.ts`
  - `inviteUserAction` — cria convite, retorna `inviteUrl` para copiar
  - `updateUserRoleAction` — altera função do usuário (apenas owner/admin, não pode mudar o próprio)
  - `toggleUserStatusAction` — ativa/desativa usuário (não pode desativar owner)
  - `cancelInvitationAction` — cancela convite pendente

### Páginas
- `app/(app)/configuracoes/usuarios/page.tsx` — Server Component que busca membros e convites pendentes
- `app/(app)/configuracoes/usuarios/users-client.tsx` — tabela interativa com convidar/alterar função/desativar
- `app/aceitar-convite/page.tsx` — rota pública; redireciona não-autenticados para `/register?invite=<token>`
- `app/aceitar-convite/accept-invite-client.tsx` — chama RPC `accept_invitation` e redireciona ao dashboard

### Fluxo de convite
1. Owner/admin abre dialog → preenche e-mail + função → recebe link
2. Copia e envia o link para o colaborador
3. Colaborador acessa `/aceitar-convite?token=...`
   - Se não logado: redireciona para `/register?invite=<token>` (token preservado)
   - Se logado: botão chama RPC → cria perfil → redireciona ao dashboard
4. Após registro sem confirmação de e-mail: redireciona direto para `/aceitar-convite`
5. Com confirmação de e-mail: `emailRedirectTo` aponta para `/auth/callback?next=/aceitar-convite?token=...`

### Middleware (proxy)
- `/aceitar-convite` adicionado às rotas públicas (não redireciona para login)

**Próximos passos**: FASE 7 — Configurações
