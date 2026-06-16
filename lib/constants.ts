export const APP_NAME = "ScooterGestor"
export const APP_URL = "https://app.scootergestor.com.br"
export const LANDING_URL = "https://scootergestor.com.br"
export const WHATSAPP_NUMBER = "5521999999999"
export const SUPPORT_EMAIL = "suporte@scootergestor.com.br"

export const PLANS = ["start", "pro", "premium"] as const
export type Plan = (typeof PLANS)[number]

export const ROLES = ["owner", "admin", "manager", "seller", "technician", "cashier"] as const
export type Role = (typeof ROLES)[number]

export const COMPANY_STATUS = ["trial", "active", "suspended", "canceled"] as const
export type CompanyStatus = (typeof COMPANY_STATUS)[number]

export const PRODUCT_TYPES = [
  "scooter",
  "helmet",
  "battery",
  "charger",
  "tire",
  "part",
  "accessory",
  "service",
  "other",
] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  scooter: "Scooter Elétrica",
  helmet: "Capacete",
  battery: "Bateria",
  charger: "Carregador",
  tire: "Pneu/Câmara",
  part: "Peça",
  accessory: "Acessório",
  service: "Serviço",
  other: "Outro",
}

export const OS_PRIORITIES = ["baixa", "normal", "alta", "urgente"] as const
export type OSPriority = (typeof OS_PRIORITIES)[number]

export const OS_PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
}

export const OS_PRIORITY_COLORS: Record<string, string> = {
  baixa: "bg-slate-100 text-slate-700",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
}

export const SALE_STATUS = ["concluida", "cancelada", "pendente"] as const
export type SaleStatus = (typeof SALE_STATUS)[number]

export const WARRANTY_TYPES = ["produto", "servico", "bateria", "carregador", "scooter"] as const
export type WarrantyType = (typeof WARRANTY_TYPES)[number]

export const PAYMENT_METHODS = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
  "boleto",
  "misto",
  "outro",
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão de Débito",
  cartao_credito: "Cartão de Crédito",
  boleto: "Boleto",
  misto: "Pagamento Misto",
  outro: "Outro",
}

export const STOCK_MOVEMENT_TYPES = ["entrada", "saida", "ajuste", "perda", "devolucao"] as const
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

export const STOCK_MOVEMENT_REASONS = [
  "venda",
  "ordem_servico",
  "compra_fornecedor",
  "ajuste_manual",
  "perda_quebra",
  "devolucao_cliente",
] as const
export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number]

export const FINANCIAL_TYPES = ["entrada", "saida"] as const
export type FinancialType = (typeof FINANCIAL_TYPES)[number]

export const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  seller: "Vendedor",
  technician: "Técnico",
  cashier: "Caixa",
}

export const PLAN_LABELS: Record<string, string> = {
  start: "Start",
  pro: "Pro",
  premium: "Premium",
}

export const DEFAULT_OS_STATUSES = [
  { name: "Aberta", slug: "aberta", color: "#6366f1", display_order: 1, is_default: true, is_final: false },
  { name: "Aguardando Diagnóstico", slug: "aguardando-diagnostico", color: "#f59e0b", display_order: 2, is_default: false, is_final: false },
  { name: "Aguardando Aprovação", slug: "aguardando-aprovacao", color: "#f97316", display_order: 3, is_default: false, is_final: false },
  { name: "Aprovada", slug: "aprovada", color: "#3b82f6", display_order: 4, is_default: false, is_final: false },
  { name: "Em Manutenção", slug: "em-manutencao", color: "#8b5cf6", display_order: 5, is_default: false, is_final: false },
  { name: "Aguardando Peça", slug: "aguardando-peca", color: "#ef4444", display_order: 6, is_default: false, is_final: false },
  { name: "Concluída", slug: "concluida", color: "#10b981", display_order: 7, is_default: false, is_final: false },
  { name: "Entregue", slug: "entregue", color: "#059669", display_order: 8, is_default: false, is_final: true },
  { name: "Cancelada", slug: "cancelada", color: "#64748b", display_order: 9, is_default: false, is_final: true },
]

export const DEFAULT_CHECKLIST_ITEMS = [
  { label: "Scooter liga?", input_type: "yes_no_na", required: true, display_order: 1 },
  { label: "Painel funciona?", input_type: "yes_no_na", required: true, display_order: 2 },
  { label: "Bateria carrega?", input_type: "yes_no_na", required: true, display_order: 3 },
  { label: "Carregador foi entregue?", input_type: "yes_no_na", required: false, display_order: 4 },
  { label: "Cliente deixou chave?", input_type: "yes_no_na", required: false, display_order: 5 },
  { label: "Freio dianteiro funciona?", input_type: "yes_no_na", required: true, display_order: 6 },
  { label: "Freio traseiro funciona?", input_type: "yes_no_na", required: true, display_order: 7 },
  { label: "Pneu dianteiro está bom?", input_type: "yes_no_na", required: false, display_order: 8 },
  { label: "Pneu traseiro está bom?", input_type: "yes_no_na", required: false, display_order: 9 },
  { label: "Possui riscos?", input_type: "yes_no_na", required: false, display_order: 10 },
  { label: "Possui amassados?", input_type: "yes_no_na", required: false, display_order: 11 },
  { label: "Possui peças quebradas?", input_type: "yes_no_na", required: false, display_order: 12 },
  { label: "Possui barulho estranho?", input_type: "yes_no_na", required: false, display_order: 13 },
  { label: "Acelerador funciona?", input_type: "yes_no_na", required: true, display_order: 14 },
  { label: "Luzes funcionam?", input_type: "yes_no_na", required: false, display_order: 15 },
  { label: "Buzina funciona?", input_type: "yes_no_na", required: false, display_order: 16 },
  { label: "Fotos anexadas?", input_type: "yes_no_na", required: false, display_order: 17 },
]

export const DEFAULT_PAYMENT_METHODS = [
  { name: "Dinheiro", type: "cash", active: true },
  { name: "Pix", type: "pix", active: true },
  { name: "Cartão de Débito", type: "debit_card", active: true },
  { name: "Cartão de Crédito", type: "credit_card", active: true },
  { name: "Boleto", type: "bank_slip", active: false },
]

export const DEFAULT_FINANCIAL_CATEGORIES = {
  expense: [
    "Aluguel",
    "Energia",
    "Internet",
    "Funcionários",
    "Fornecedor",
    "Compra de Estoque",
    "Marketing",
    "Ferramentas",
    "Manutenção",
    "Outros",
  ],
  income: [
    "Venda de Produto",
    "Serviço de Oficina",
    "Venda de Scooter",
    "Garantia",
    "Outros",
  ],
}

export const DEFAULT_WARRANTY_RULES = [
  { name: "Serviço", warranty_type: "servico", duration_days: 30 },
  { name: "Peça", warranty_type: "produto", duration_days: 90 },
  { name: "Bateria", warranty_type: "bateria", duration_days: 180 },
  { name: "Scooter Nova", warranty_type: "scooter", duration_days: 365 },
  { name: "Carregador", warranty_type: "carregador", duration_days: 90 },
]

export const DEFAULT_SERVICES = [
  { name: "Troca de Pneu", description: "Troca de pneu dianteiro ou traseiro", default_price: 50, estimated_minutes: 30, warranty_days: 30 },
  { name: "Troca de Bateria", description: "Substituição da bateria principal", default_price: 80, estimated_minutes: 45, warranty_days: 90 },
  { name: "Troca de Controladora", description: "Substituição da controladora elétrica", default_price: 120, estimated_minutes: 60, warranty_days: 90 },
  { name: "Revisão Geral", description: "Revisão completa da scooter elétrica", default_price: 150, estimated_minutes: 90, warranty_days: 30 },
  { name: "Ajuste de Freio", description: "Ajuste e regulagem dos freios", default_price: 30, estimated_minutes: 20, warranty_days: 30 },
  { name: "Troca de Acelerador", description: "Substituição do manete acelerador", default_price: 60, estimated_minutes: 30, warranty_days: 60 },
  { name: "Diagnóstico Elétrico", description: "Diagnóstico do sistema elétrico", default_price: 50, estimated_minutes: 60, warranty_days: 0 },
  { name: "Troca de Carregador", description: "Substituição do carregador", default_price: 40, estimated_minutes: 15, warranty_days: 90 },
  { name: "Manutenção Preventiva", description: "Manutenção preventiva completa", default_price: 100, estimated_minutes: 60, warranty_days: 30 },
]

export const WHATSAPP_VARIABLES = [
  "{{cliente}}",
  "{{numero_os}}",
  "{{modelo}}",
  "{{valor}}",
  "{{status}}",
  "{{nome_loja}}",
  "{{telefone_loja}}",
  "{{data_previsao}}",
  "{{tecnico}}",
]

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    name: "OS Aberta",
    trigger_key: "os_aberta",
    content: "Olá, {{cliente}}! Sua ordem de serviço nº {{numero_os}} foi aberta com sucesso.\n\nEquipamento: {{modelo}}\nStatus: Aguardando diagnóstico.\n\nAtenciosamente,\n{{nome_loja}}",
  },
  {
    name: "Orçamento Pronto",
    trigger_key: "orcamento_pronto",
    content: "Olá, {{cliente}}! O orçamento da sua scooter ficou pronto.\n\nOS: {{numero_os}}\nValor total: R$ {{valor}}\n\nPodemos seguir com o serviço?",
  },
  {
    name: "OS em Manutenção",
    trigger_key: "os_manutencao",
    content: "Olá, {{cliente}}! Informamos que sua scooter já está em manutenção.\n\nOS: {{numero_os}}\nPrevisão de entrega: {{data_previsao}}\n\nAtenciosamente,\n{{nome_loja}}",
  },
  {
    name: "OS Concluída",
    trigger_key: "os_concluida",
    content: "Olá, {{cliente}}! Sua scooter está pronta para retirada.\n\nOS: {{numero_os}}\nValor total: R$ {{valor}}\n\nAtenciosamente,\n{{nome_loja}}",
  },
  {
    name: "Aguardando Peça",
    trigger_key: "os_aguardando_peca",
    content: "Olá, {{cliente}}! Informamos que sua OS {{numero_os}} está aguardando a chegada de uma peça. Assim que chegar, daremos continuidade ao serviço.\n\nAtenciosamente,\n{{nome_loja}}",
  },
  {
    name: "Agradecimento após Compra",
    trigger_key: "agradecimento_compra",
    content: "Olá, {{cliente}}! Obrigado pela sua compra na {{nome_loja}}! Qualquer dúvida, estamos à disposição.\n\n{{telefone_loja}}",
  },
]
