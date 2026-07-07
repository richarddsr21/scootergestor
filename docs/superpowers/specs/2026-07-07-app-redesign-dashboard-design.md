# Redesign do app logado — Fase 1: fundação + Dashboard

## Contexto

O app hoje usa a identidade "Electric Precision" (navy `#07111F` + azul
`#0EA5E9` + verde `#22C55E`, fontes Syne/Outfit/Geist Mono), definida em
`app/globals.css` via CSS variables globais (`:root` / `.dark`) e
consumida por **todo** o site — landing (`(public)`), login/registro
(`(auth)`), admin (`(admin)`) e o app logado (`(app)`).

O usuário quer um redesign completo e ousado só do app logado — dashboard,
OS, clientes, estoque, financeiro etc. — **sem tocar** em landing,
login/registro nem no painel `/admin`. Dado o tamanho do trabalho (uma
identidade visual nova inteira + dezenas de páginas), este ciclo cobre
só a **fundação** (tokens, fontes, shell) e a **página de Dashboard**.
As demais páginas do `(app)` recebem specs próprias em ciclos seguintes,
reaproveitando a mesma fundação.

Direção visual acordada com o usuário: paleta escura "ink" + teal como
cor de ação/destaque + coral como cor de alerta, tipografia
Manrope/Inter/JetBrains Mono, layout em bento grid assimétrico (não grade
uniforme), shell "flutuante" (sidebar/topbar destacadas da borda, com
leve glass), Framer Motion para as transições-chave, e o "Teal Glow
System": foco/hover/seleção emitem um glow sutil na cor de destaque.

## Escopo

**Dentro:**
- Tokens de cor/tipografia novos, isolados do `(app)`.
- Shell: `AppSidebar`, `AppHeader`, `AppShell` (+ novo bottom nav mobile
  e overlay tablet, que não existem hoje).
- Componentes base usados pelo dashboard: `Button`, `Input`, `Card`,
  `Badge`/`StatusBadge`, `MetricCard`, `Dialog`, `Sonner` (toast).
- Página `/dashboard` (`app/(app)/dashboard/page.tsx`).
- Dependência nova: `framer-motion`.

**Fora (ciclos futuros):**
- `(public)`, `(auth)`, `(admin)` — inalterados.
- Todas as demais páginas do `(app)`: clientes, produtos, estoque,
  vendas, oficina, garantias, caixa, financeiro, relatórios,
  fornecedores, configurações, onboarding.
- Tabela genérica `components/ui/table.tsx` além do necessário pro
  dashboard (dashboard não usa tabela, usa listas).
- Qualquer alteração em regra de negócio/dado — é puramente visual +
  as 3 novas queries de agregação descritas abaixo.

## Arquitetura de tokens (isolamento sem afetar o resto do site)

Problema: variáveis CSS hoje são globais em `:root`/`.dark`. Um wrapper
`<div>` dentro do `AppShell` não bastaria, porque componentes Radix
(Dialog, DropdownMenu, Select, Popover, Tooltip) e o Sonner renderizam
via portal direto em `document.body`, fora da árvore desse wrapper — CSS
variable só cascateia pela árvore do DOM, então modais/dropdowns
ficariam com a paleta antiga.

Solução: `AppShell` (já é client component) aplica uma classe no
`<body>` via `useEffect`, no mount/unmount:

```tsx
React.useEffect(() => {
  document.body.classList.add("app-theme")
  return () => document.body.classList.remove("app-theme")
}, [])
```

Como `body` é ancestral comum de tudo — inclusive dos portais — os
tokens cascateiam corretamente pra qualquer elemento renderizado
enquanto o app está montado. `(public)/(auth)/(admin)` nunca ganham essa
classe, então continuam com a paleta atual. Aceito o pequeno risco de
flash da paleta antiga por uma fração de segundo em hard-refresh direto
numa rota do app (decisão já validada com o usuário) — sem script
bloqueante adicional.

Em `app/globals.css`, um novo bloco `body.app-theme { ... }` (e
`body.app-theme.dark { ... }` pro modo escuro, que continua sendo o
padrão via `next-themes`) redefine as mesmas custom properties que hoje
vivem em `:root`/`.dark` (`--background`, `--card`, `--primary`,
`--secondary`, `--muted`, `--accent`, `--destructive`, `--border`,
`--input`, `--ring`, `--sidebar*`, `--chart-*`) mais os tokens novos
exclusivos do spec (`--surface-0..3`, `--brand-teal*`, `--brand-coral*`,
`--brand-ink`, `--text-primary/secondary/muted`). O bloco `@theme inline`
existente já mapeia `--color-background: var(--background)` etc., então
nada muda nas classes utilitárias (`bg-background`, `text-primary`...) —
elas simplesmente resolvem pro novo valor quando `body.app-theme` está
presente.

### Paleta — dark (padrão)

```
--brand-ink:        #1A1F2E
--brand-teal:        #00BFA6
--brand-teal-dim:    #00A08C
--brand-teal-glow:   rgba(0,191,166,0.15)
--brand-coral:       #FF6B6B
--brand-coral-dim:   #E05555

--surface-0: #0F1219   (→ --background)
--surface-1: #161B27   (→ --card, --popover, --sidebar)
--surface-2: #1E2433   (→ --secondary, --muted, --input)
--surface-3: #252B3B   (→ hover/active, --accent)
--surface-border: rgba(255,255,255,0.06)  (→ --border)

--text-primary:   #F0F2F8  (→ --foreground)
--text-secondary: #8B92A5  (→ --muted-foreground)
--text-muted:     #4A5168

--primary: var(--brand-teal)          --primary-foreground: var(--brand-ink)
--ring:    var(--brand-teal)          (→ glow de foco em TODOS os elementos, de graça)
--destructive: var(--brand-coral)

--success: #22C55E   --warning: #F59E0B   --error: #EF4444   --info: #3B82F6
```

### Paleta — light (toggle continua existindo dentro do app)

Deriva a mesma identidade pra fundo claro — teal e coral mantêm o
mesmo hue, só ajusto neutros:

```
--surface-0: #FFFFFF
--surface-1: #F7F8FA
--surface-2: #EEF0F4
--surface-3: #E3E6ED
--surface-border: rgba(15,18,25,0.08)

--text-primary:   #1A1F2E
--text-secondary: #5B6178
--text-muted:     #9AA0B4

--primary: #00A08C (brand-teal-dim, mais escuro pra contraste em fundo branco)
--primary-foreground: #FFFFFF
--ring: #00A08C
--destructive: #E05555
```

Badges de status reaproveitam o sistema `.badge-amber/emerald/red/blue/
violet/slate` já existente em `globals.css` (que já tem par claro+escuro
pronto) — só recalibro os tons pra ficarem consistentes com o teal/coral
novo em vez do azul/verde antigo. Não crio um sistema de badge paralelo.

### Tipografia

Novo arquivo `app/(app)/fonts.ts` carregando Manrope (600/700/800),
Inter (400/500) e JetBrains Mono (400/500) via `next/font/google`,
expondo as strings de classe `--font-manrope`, `--font-inter`,
`--font-jbmono` (o padrão `.variable` do `next/font`). Fontes têm o
mesmo problema de portal que as cores — só funcionam onde a classe da
variável estiver presente na árvore. Solução: `app/(app)/layout.tsx`
(Server Component) importa as 3 fontes e passa as strings de variável
como prop pro `AppShell`, que as adiciona ao `document.body.classList`
no mesmo `useEffect` que já aplica `app-theme` — cores e fontes chegam
a modais/dropdowns/toasts pela mesma via.

Em `body.app-theme`: `--font-sans: var(--font-inter)`, `--font-display:
var(--font-manrope)`, `--font-mono: var(--font-jbmono)`. `(public)/(auth)/
(admin)` continuam com Outfit/Syne/Geist Mono.

Escala tipográfica: usa a escala do spec do usuário (11/13/15/16/17/20/
24/30/36/48px) como classes utilitárias Tailwind já existentes
(`text-xs` a `text-5xl`) — não precisa de nada novo, só aplicar
`font-display` (Manrope) em headings e `font-mono` (JetBrains Mono) em
valores monetários / números de OS.

## Shell: sidebar, topbar, navegação mobile

- **Desktop (≥1280px):** `AppSidebar` e `AppHeader` deixam de ficar
  coladas nas bordas — margem `top-4 left-4` (sidebar) / `top-4
  left-[calc(...)] right-4` (topbar), cantos `rounded-2xl`,
  `backdrop-blur-md` + `bg-surface-1/80`. O conteúdo principal ganha
  padding extra pra não ficar embaixo do chrome flutuante. Mantém
  colapsar 240px↔64px, grupos Principal/Controle/Admin existentes,
  ícones Lucide stroke 1.5. Item ativo: borda-left teal + fundo
  `--brand-teal-glow`.
- **Tablet (768–1279px):** sidebar vira drawer/overlay acionado por
  hambúrguer no topbar (não existe hoje — novo `useState` de
  aberto/fechado + overlay com `bg-black/70 backdrop-blur-sm`, fecha ao
  clicar fora ou navegar).
- **Mobile (<768px):** sidebar some; bottom nav fixa com 5 itens
  (Dashboard, Oficina, Clientes, Estoque, "Mais" → abre `Sheet` com o
  resto dos itens de Controle/Admin). `bg-surface-1/90
  backdrop-blur-xl`, item ativo com ícone filled + label teal + dot.
  Novo componente `components/layout/app-bottom-nav.tsx`.
- Fundo geral (`--surface-0`) ganha um gradiente radial teal muito
  sutil fixo (`background-image` no wrapper, opacity baixa) em vez de
  cor chapada — textura discreta, sem custo de performance.

## Componentes base

- **Button** (`components/ui/button.tsx`): variant `default` recolore
  pro teal (`--primary`), ganha `hover:brightness-110
  hover:-translate-y-px` + glow (`hover:shadow-[0_0_20px_var(--brand-teal-glow)]`).
  `destructive` já usa `--destructive` (agora coral) — só ajusta pra
  fundo translúcido (`bg-destructive/10 border-destructive/30
  text-destructive`) em vez de sólido, como no spec. `secondary`/`ghost`
  seguem tokens sem mudança estrutural.
- **Input**: sem mudança estrutural — `--ring: var(--brand-teal)` já
  entrega o glow de foco em todos os inputs/selects/comboboxes de
  graça, porque o shadcn usa `ring-ring` no `focus-visible` globalmente.
- **Card**: mantém radius 12px (já é o valor de `--radius-xl` hoje),
  sombra em duas camadas do spec. Hover-glow (translateY + box-shadow
  teal) fica restrito à variante bento/métrica — cards comuns só
  recebem a transição de borda.
- **MetricCard / bento tile**: reescrito pra suportar tamanhos `hero`
  (2×2, radius 16px, com sparkline embutido) e `default` (1×1, radius
  12px), ver seção Dashboard.
- **StatusBadge**: paleta recalibrada (ver Paleta acima), sem mudança de
  API.
- **Dialog/Sonner**: só re-tokenizados (herdam `body.app-theme`
  automaticamente); overlay `rgba(0,0,0,0.7)` + `blur(4px)`, radius
  16px, timing de animação 200ms conforme spec.

## Dashboard — novo IA em bento grid

Layout novo, assimétrico (não grade uniforme):

1. **Bento hero (linha 1, 4 colunas de largura total):**
   - Tile grande 2×2: **Faturamento do Mês** — número em JetBrains
     Mono 32px, sparkline dos últimos 7 dias embutido no próprio tile
     (recharts `AreaChart` mini, sem eixos), glow teal permanente
     (não só hover, é o tile mais importante).
   - 3 tiles 1×1 ao redor: **OS Abertas hoje**, **Estoque Baixo**,
     **Clientes Atendidos no Mês** (novo — clientes distintos com
     venda ou OS criada no mês corrente), cada um com sparkline 7 dias
     e contador animado (`useCountUp` via `framer-motion`).
2. **Linha 2:** gráfico grande de faturamento — `LineChart` recharts,
   últimos 30 dias, linha teal + área com gradiente teal→transparente,
   grid só horizontal, tooltip com `surface-2` (8 colunas) + "OS
   recentes" reordenada por prioridade — urgente primeiro (4 colunas).
3. **Linha 3:** "Últimas vendas" (mantida) + métricas secundárias que
   hoje são cards cheios (Faturado Hoje, Total de Clientes, Aguard.
   Aprovação, OS Concluídas Hoje, Pgtos Recebidos Hoje) viram **chips
   compactos** numa fileira horizontal — mesma informação, menos peso
   visual.

### Novas queries (`app/(app)/dashboard/page.tsx`)

- Clientes distintos com `sales.created_at >= monthStart` OU
  `service_orders.created_at >= monthStart` (dedup por `customer_id`).
- Série diária (7 dias) de faturamento pra sparkline dos 4 tiles hero
  (reutiliza a mesma tabela `payments` já consultada, agrupando por
  dia) — 1 query adicional agregando por dia em vez de só somando.
- Série diária (30 dias) de faturamento pro `LineChart` central —
  mesma fonte, janela maior.

Todas via `Promise.all` junto das queries existentes, seguindo o
padrão de performance já estabelecido no projeto (nunca sequencial).

## Motion

Adiciona `framer-motion` como dependência nova. Uso restrito e
intencional (seguindo a boa prática de não animar tudo ao mesmo tempo):

- Entrada dos tiles do bento em stagger (`staggerChildren` ~40ms) ao
  montar a página do dashboard.
- Contador dos KPIs (`animate`/`useMotionValue` de 0 até o valor final,
  ~800ms ease-out).
- Transição de página (fade + slideY 8px) via `AnimatePresence` no
  `AppShell`, entre navegações dentro do `(app)`.

Hover/glow contínuo (cards, botões, sidebar) continua em CSS puro
(mais barato que JS pra estado contínuo de hover). Tudo respeita
`prefers-reduced-motion` (framer-motion: checar `useReducedMotion()` e
desligar stagger/transição de página; CSS: media query já é prática do
projeto).

## Acessibilidade

- Contraste mínimo 4.5:1 — validar `--text-secondary`/`--text-muted`
  contra `--surface-0/1` em ambos os temas antes de finalizar (os
  valores acima são ponto de partida, não immutáveis).
- Focus ring visível herdado de `--ring` em todo elemento interativo.
- Cor nunca sozinha — badges de status mantêm o texto, ícones onde
  fizer sentido.
- Bottom nav mobile, drawer tablet e Dialog têm focus trap / fecham
  com `Escape`.
- `prefers-reduced-motion` cobre CSS e framer-motion.

## Fora de escopo (recapitulando)

- Landing, login/registro, admin.
- Qualquer página do app além do Dashboard.
- Mudança de regra de negócio.
- Testes automatizados de UI (o projeto não tem suíte de UI hoje).

## Arquivos afetados

- `app/globals.css` — blocos `body.app-theme` (dark/light), paleta,
  badges recalibrados.
- `app/(app)/fonts.ts` (novo) — Manrope/Inter/JetBrains Mono.
- `app/(app)/layout.tsx` — aplica variáveis de fonte.
- `components/layout/app-shell.tsx` — mount effect da classe
  `app-theme`, `AnimatePresence` de transição de página, novo
  breakpoint tablet/mobile.
- `components/layout/app-sidebar.tsx` — visual flutuante + overlay
  tablet.
- `components/layout/app-header.tsx` — visual flutuante + botão
  hambúrguer (tablet/mobile).
- `components/layout/app-bottom-nav.tsx` (novo) — bottom nav mobile.
- `components/ui/button.tsx`, `components/ui/card.tsx` — ajustes de
  variant/hover.
- `components/shared/metric-card.tsx` — variantes `hero`/`default` +
  sparkline + counter animado.
- `components/shared/status-badge.tsx` — paleta recalibrada.
- `app/(app)/dashboard/page.tsx` — novo IA bento + 3 queries novas.
- `package.json` — adiciona `framer-motion`.

## Teste

1. Abrir `/dashboard` logado — confere bento grid, sparklines, contador
   animado, glow no tile de faturamento, gráfico de 30 dias, chips
   compactos.
2. Redimensionar pra 768px e 390px — confere drawer tablet e bottom nav
   mobile funcionando (abrir/fechar, navegação, item ativo).
3. Alternar claro/escuro pelo toggle do header — confere os dois temas
   novos (não os antigos).
4. Abrir um modal (ex.: diálogo de pagamento de OS a partir de outra
   página) e um dropdown — confirmar que herdam a paleta nova mesmo
   sendo portal em `body`.
5. Navegar pra `/`, `/login`, `/admin` — confirmar que continuam com a
   paleta e fontes antigas, sem a classe `app-theme` no body.
6. Testar com `prefers-reduced-motion: reduce` ativado no SO/navegador —
   confirmar que stagger/transição de página/contador não animam (ou
   animam instantaneamente).
