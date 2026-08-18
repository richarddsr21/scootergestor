# Chat de suporte em tempo real (cliente ↔ admin)

## Contexto

Hoje não existe nenhum canal de suporte dentro do app — o cliente
precisa sair do ScooterGestor (WhatsApp, e-mail) pra falar com o
suporte. Não existe nenhuma infra de tempo real no projeto ainda
(`grep` por `realtime`/`channel(` no repo não retorna nada), mas o
stack já usa `@supabase/supabase-js` (v2), que traz Realtime nativo
(Postgres Changes) sem precisar de serviço externo.

O painel `/admin` (`app/(admin)/admin/[id]/page.tsx`) hoje só mostra
dados da empresa e os botões de ativar/suspender manualmente
(`lib/actions/admin.ts`). Existe um único admin de SaaS, identificado
pelo claim `app_metadata.is_saas_admin` no JWT (função
`is_saas_admin()`, `supabase/migrations/20260530000000_initial_schema.sql`)
— não há tabela de múltiplos agentes de suporte.

## Problema

Dar ao cliente um jeito de conversar com o suporte sem sair do app, e
a você (admin) um jeito de ver e responder essas conversas, com
entrega em tempo real dos dois lados.

Requisitos definidos com o usuário:

1. Conversa é **por empresa** — qualquer funcionário logado da mesma
   empresa vê o mesmo histórico e pode escrever nele. Não é uma
   conversa isolada por pessoa.
2. Do lado do cliente, o chat abre a partir de um ícone no **header**
   do app (`components/layout/app-header.tsx`), ao lado do sino de
   notificações.
3. Do lado do admin, existe uma **caixa de entrada dedicada** em
   `/admin/suporte` — lista de empresas com conversa, ordenada pela
   mais recente, com contador de não lidas.
4. v1 não tem e-mail/push — o aviso de mensagem nova pro admin é só o
   badge de não lidas dentro do próprio `/admin`.

## Solução

### A) Tabelas novas

Migration nova (`supabase/migrations/20260817000001_add_support_chat.sql`):

```sql
CREATE TABLE support_conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  company_last_read_at  timestamptz NOT NULL DEFAULT now(),
  admin_last_read_at    timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type      text NOT NULL CHECK (sender_type IN ('company', 'admin')),
  sender_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  body             text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id, created_at);
CREATE INDEX idx_support_conversations_updated ON support_conversations(updated_at DESC);

CREATE OR REPLACE FUNCTION support_touch_conversation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE support_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_messages_touch_conversation
AFTER INSERT ON support_messages
FOR EACH ROW EXECUTE FUNCTION support_touch_conversation();
```

`sender_profile_id` é sempre nulo quando `sender_type = 'admin'` (não
há tabela de agentes — só existe "o suporte"). Uma linha em
`support_conversations` só existe depois da primeira mensagem — não é
criada no onboarding da empresa (evita linha vazia pra toda empresa
que nunca falou com o suporte). Como `company_id` é `UNIQUE`, se dois
funcionários da mesma empresa abrirem o chat pela primeira vez ao
mesmo tempo, a segunda tentativa de criar a conversa falha por
constraint — `getOrCreateConversationAction` trata isso buscando de
novo antes de propagar erro (mesmo padrão de "insert, se falhar por
duplicidade, faz select").

Não lido é calculado, não armazenado por mensagem:

- Não lidas do cliente = `count(support_messages WHERE conversation_id = X AND sender_type = 'admin' AND created_at > company_last_read_at)`.
- Não lidas do admin (por empresa, pro inbox) = mesma lógica invertida.

`updated_at` em `support_conversations` é tocado a cada `INSERT` em
`support_messages` (trigger), usado só pra ordenar o inbox do admin
pela conversa mais recente.

### B) RLS

Mesmo padrão do resto do schema (`get_current_company_id()` /
`is_saas_admin()`, `20260530000000_initial_schema.sql`):

```sql
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages      ENABLE ROW LEVEL SECURITY;

-- support_conversations: a empresa vê/cria a própria; admin vê/edita todas
CREATE POLICY support_conversations_select ON support_conversations FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_conversations_insert ON support_conversations FOR INSERT
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());

-- UPDATE só serve pra gravar *_last_read_at do próprio lado
CREATE POLICY support_conversations_update ON support_conversations FOR UPDATE
  USING (company_id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());

-- support_messages: ler é liberado pra quem enxerga a conversa (via join implícito na policy)
CREATE POLICY support_messages_select ON support_messages FOR SELECT
  USING (
    is_saas_admin()
    OR conversation_id IN (SELECT id FROM support_conversations WHERE company_id = get_current_company_id())
  );

-- inserir como empresa: só na própria conversa, sender_type tem que ser 'company'
CREATE POLICY support_messages_insert_company ON support_messages FOR INSERT
  WITH CHECK (
    sender_type = 'company'
    AND conversation_id IN (SELECT id FROM support_conversations WHERE company_id = get_current_company_id())
  );

-- inserir como admin: qualquer conversa, sender_type tem que ser 'admin'
CREATE POLICY support_messages_insert_admin ON support_messages FOR INSERT
  WITH CHECK (sender_type = 'admin' AND is_saas_admin());
```

Como a empresa não tem uma conversa antes da primeira mensagem, a
primeira mensagem do cliente precisa **criar** a
`support_conversation` e a `support_message` — feito numa única server
action transacional (item D), não direto do client.

### C) Realtime

Habilitar as duas tabelas na publication padrão do Supabase:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
```

O Realtime do Supabase respeita RLS nas mudanças que emite — um
cliente autenticado só recebe eventos de linhas que a própria RLS
deixaria ele `SELECT`. Isso significa:

- **Painel do cliente**: assina `postgres_changes` em
  `support_messages` filtrado por `conversation_id = <id da própria
  conversa>` — recebe mensagens novas do admin em tempo real enquanto
  o painel está aberto.
- **Inbox do admin**: assina `postgres_changes` em `support_messages`
  **sem filtro** (a RLS de admin libera tudo) — qualquer mensagem nova
  de qualquer empresa atualiza a lista (reordena + incrementa badge)
  em tempo real, mesmo sem estar com uma conversa específica aberta.

### D) Server actions (`lib/actions/support.ts`)

Mesmo padrão de `getCtx()` usado em `lib/actions/billing.ts`:

- `getOrCreateConversationAction()` — busca a conversa da empresa do
  usuário logado; se não existir, cria. Retorna `conversationId`. Chamado
  quando o cliente abre o painel de chat pela primeira vez.
- `sendCompanyMessageAction(conversationId: string, body: string)` —
  insere mensagem com `sender_type: 'company'`, `sender_profile_id` =
  perfil logado. Valida `body` não vazio (o `CHECK` do banco é o
  cinto de segurança, a action retorna erro amigável antes disso).
- `sendAdminMessageAction(conversationId: string, body: string)` —
  igual, mas só roda se `is_saas_admin()` (checagem client-side de UX;
  a RLS é quem garante de verdade, mesmo padrão de
  `adminSetCompanyStatusAction`).
- `markConversationReadAction(conversationId: string, side: "company" | "admin")` —
  grava `company_last_read_at`/`admin_last_read_at` = `now()`. Chamado
  ao abrir o painel de chat (cliente) ou ao abrir uma conversa
  específica (admin).
- `getSupportInboxAction()` — só admin. Retorna todas as
  `support_conversations` com nome da empresa (`join companies`),
  última mensagem (preview) e contagem de não lidas, ordenado por
  `updated_at desc`. Usado pela tela `/admin/suporte`.

Todas retornam o mesmo formato `ActionState`-like já usado no projeto
(`{ error?: string }` + dados quando aplicável).

### E) Painel do cliente (header)

Novo componente `components/layout/support-chat.tsx`, montado no
`AppHeader` ao lado do `NotificationBell` (`components/layout/app-header.tsx`,
linha ~84).

- Ícone `MessageCircle` (lucide), mesmo estilo visual do
  `ThemeToggle`/`NotificationBell` (`size-9`, `variant="ghost"`), com
  badge de não lidas igual ao do sino (`bg-red-500`, canto superior
  direito).
- Clique abre um `Sheet` (`components/ui/sheet.tsx`, já existe no
  projeto) deslizando da direita — não um `Popover` pequeno, porque
  chat precisa de mais espaço vertical que uma notificação.
- Dentro do Sheet: `ScrollArea` com as mensagens (bolhas alinhadas à
  direita se `sender_type === 'company'`, à esquerda se `'admin'`,
  mesmo padrão visual de qualquer chat), `Textarea` + botão enviar
  fixos embaixo.
- Ao abrir: chama `getOrCreateConversationAction`, carrega mensagens
  (`support_messages` da conversa, ordenadas por `created_at`), chama
  `markConversationReadAction(..., "company")`, e assina o canal
  Realtime da conversa enquanto o Sheet estiver aberto (desinscreve ao
  fechar).
- Badge de não lidas no ícone (mesmo fechado): calculado no mount do
  `AppHeader` via uma contagem leve (mesma query do "não lidas do
  cliente" do item A) — sem precisar abrir o Sheet pra saber que tem
  mensagem nova. Atualiza também por Realtime (assina
  `support_messages` da própria conversa mesmo com o Sheet fechado,
  igual ao princípio do inbox do admin, só que filtrado).

### F) Inbox do admin (`/admin/suporte`)

Nova rota `app/(admin)/admin/suporte/page.tsx`, protegida pelo mesmo
layout de admin existente (`app/(admin)/layout.tsx`, já checa
`is_saas_admin()`).

- Lista de empresas com conversa (via `getSupportInboxAction`):
  nome da empresa, preview da última mensagem, horário relativo, badge
  de não lidas. Ordenada por mensagem mais recente.
- Item de menu novo em algum lugar do admin (sidebar/nav do grupo
  `(admin)` — a estrutura atual só tem a lista de empresas em
  `app/(admin)/admin/page.tsx`) apontando pra `/admin/suporte`, com
  badge de total de não lidas somado (mesmo princípio do
  `NotificationBell`, mas pro admin).
- Clicar numa empresa abre o chat dela — mesmo componente de painel de
  mensagens do item E, mas reutilizado num componente compartilhado
  (`components/support/chat-panel.tsx`) parametrizado por
  `conversationId` + `viewerSide: "company" | "admin"`, pra não
  duplicar a lógica de listar/enviar/assinar Realtime entre cliente e
  admin.

### G) Fluxo de leitura (evitar loop de re-render)

`markConversationReadAction` só é chamado ao **abrir** o
painel/conversa, não a cada mensagem renderizada — evita disparar
updates em excesso. Se o painel já está aberto e chega mensagem nova
via Realtime, marca como lida imediatamente (o usuário já está vendo),
sem esperar reabrir.

## Fora de escopo

- Anexos/imagens no chat — só texto nesta v1.
- E-mail ou push notification pro admin quando o app não está aberto —
  só o badge dentro do `/admin`. Se isso virar necessidade real
  (mensagem de cliente demorando muito pra ser vista), é uma spec
  separada.
- Múltiplos agentes de suporte / atribuição de conversa — existe um
  único admin hoje (`is_saas_admin()`), então não há "quem está
  respondendo" a decidir.
- Encerrar/arquivar conversa — é uma thread contínua por empresa, sem
  estado de "resolvido".
- Indicador de "digitando..." — fora de escopo, não é essencial pro
  MVP de suporte.
- Histórico de conversa sobrevive à troca de empresa/plano — não se
  aplica, a conversa é vinculada a `company_id` que não muda.

## Arquivos afetados

- `supabase/migrations/20260817000001_add_support_chat.sql` (novo)
- `types/database.ts` — adiciona `support_conversations` e
  `support_messages`
- `lib/actions/support.ts` (novo)
- `components/layout/support-chat.tsx` (novo)
- `components/layout/app-header.tsx` — monta `<SupportChat />` ao lado
  do `<NotificationBell />`
- `components/support/chat-panel.tsx` (novo, compartilhado)
- `app/(admin)/admin/suporte/page.tsx` (novo)
- navegação do admin (onde quer que hoje existam os links do grupo
  `(admin)` — checar durante o plano de implementação) — novo item
  "Suporte" com badge

## Teste

Sem test runner no projeto (mesma convenção da spec do Asaas) — tudo
verificação manual:

1. Logar como empresa sem conversa ainda, abrir o chat pelo header,
   mandar mensagem — confirmar que cria `support_conversations` +
   `support_messages` no banco.
2. Logar como admin em `/admin/suporte`, confirmar que a empresa
   aparece na lista com a mensagem e badge de 1 não lida.
3. Abrir a conversa como admin, responder — confirmar que a resposta
   chega **em tempo real** (sem recarregar) na aba do cliente que
   ficou com o Sheet aberto.
4. Com o Sheet do cliente fechado, admin manda outra mensagem —
   confirmar que o badge do header do cliente incrementa sem precisar
   recarregar a página (Realtime também com o painel fechado).
5. Testar com dois funcionários da mesma empresa logados em abas
   diferentes — confirmar que os dois veem o mesmo histórico
   (conversa é por empresa, não por pessoa).
6. Confirmar via RLS que uma empresa não consegue ler/escrever na
   `support_conversations`/`support_messages` de outra (tentar um
   `conversation_id` de outra empresa direto pela action, esperar
   erro/vazio).
7. Confirmar que o admin consegue ver e responder conversas de
   qualquer empresa, e que o badge do inbox soma corretamente as não
   lidas de várias empresas ao mesmo tempo.
