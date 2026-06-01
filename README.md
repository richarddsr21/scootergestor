# ScooterGestor

Sistema SaaS completo para lojas e oficinas de scooters elétricas.

## Visão do Produto

O ScooterGestor é uma plataforma multiempresa que centraliza toda a operação de lojas e oficinas de scooters elétricas:

- Gestão de clientes e veículos
- Controle de produtos e estoque
- PDV (Ponto de Venda)
- Oficina e Ordens de Serviço
- Checklist de entrada
- Orçamentos
- Controle de garantias
- Financeiro básico
- Relatórios
- Mensagens prontas para WhatsApp
- Personalização por cliente
- Painel admin do SaaS

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS 4 + shadcn/ui (new-york)
- **Banco**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Formulários**: React Hook Form + Zod
- **Tabelas**: TanStack Table
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Notificações**: Sonner
- **Deploy**: Vercel

## Planos

| Plano | Preço | Usuários | Produtos | Clientes | OS/mês |
|-------|-------|----------|----------|---------|--------|
| Start | R$ 197/mês | 2 | 300 | 300 | 100 |
| Pro | R$ 297/mês | 5 | 1.500 | 2.000 | 500 |
| Premium | R$ 497/mês | 10 | 5.000 | 10.000 | 1.500 |
| Enterprise | Consulta | ∞ | ∞ | ∞ | ∞ |

## Configuração

```bash
# 1. Entre na pasta
cd scootergestor

# 2. Instale as dependências
npm install

# 3. Crie o arquivo .env.local
cp .env.example .env.local
# Preencha com suas chaves do Supabase

# 4. Execute o projeto
npm run dev
```

## Estrutura de Pastas

```
app/
  (public)/        # Landing page e páginas públicas
  (auth)/          # Login, register, recuperação de senha
  (app)/           # App privado (requer autenticação)
  admin/           # Painel admin do SaaS

components/
  ui/              # Componentes shadcn/ui
  layout/          # Sidebar, header, layouts
  landing/         # Seções da landing page
  dashboard/       # Cards e widgets do dashboard
  customers/       # Módulo de clientes
  products/        # Módulo de produtos
  inventory/       # Módulo de estoque
  sales/           # Módulo de vendas
  service-orders/  # Módulo de oficina / OS
  financial/       # Módulo financeiro
  settings/        # Módulo de configurações
  admin/           # Painel admin
  shared/          # Componentes compartilhados

lib/
  supabase/        # Clientes Supabase (client, server, middleware)
  utils.ts         # Utilitários gerais
  constants.ts     # Constantes do sistema
  plans.ts         # Configuração de planos e features

types/
  database.ts      # Tipos do banco Supabase
  app.ts           # Tipos da aplicação

hooks/             # React hooks customizados
services/          # Camada de serviços (queries Supabase)
supabase/
  migrations/      # SQL das migrações
docs/              # Documentação técnica
```

## Segurança

- Row Level Security (RLS) em todas as tabelas
- Isolamento total por `company_id`
- Funções SQL: `get_current_company_id()`, `is_saas_admin()`, `current_user_role()`
- Middleware de proteção de rotas

## Primeiro Cliente

Loja piloto: primo do fundador — loja de scooters elétricas com vendas e oficina.
