import type { Tables } from "./database"
import type { Plan, Role } from "@/lib/constants"

export type Company = Tables<"companies"> & {
  plan: Plan
}

export type Profile = Tables<"profiles"> & {
  role: Role
}

export type Customer = Tables<"customers">

export type Product = Tables<"products"> & {
  category?: ProductCategory | null
}

export type ProductCategory = Tables<"product_categories">

export type Vehicle = Tables<"vehicles"> & {
  customer?: Customer | null
}

export type ServiceOrder = Tables<"service_orders"> & {
  customer?: Customer | null
  vehicle?: Vehicle | null
  technician?: Profile | null
  status?: ServiceOrderStatus | null
  items?: ServiceOrderItem[]
}

export type ServiceOrderStatus = Tables<"service_order_statuses">

export type ServiceOrderItem = Tables<"service_order_items"> & {
  product?: Product | null
}

export type Sale = Tables<"sales"> & {
  customer?: Customer | null
  items?: SaleItem[]
}

export type SaleItem = Tables<"sale_items"> & {
  product?: Product | null
}

export type Warranty = Tables<"warranties"> & {
  customer?: Customer | null
  product?: Product | null
  vehicle?: Vehicle | null
  service_order?: ServiceOrder | null
}

export type Supplier = Tables<"suppliers">

export type FinancialTransaction = Tables<"financial_transactions">

export type MessageTemplate = Tables<"message_templates">

export type ChecklistTemplate = Tables<"checklist_templates"> & {
  items?: ChecklistTemplateItem[]
}

export type ChecklistTemplateItem = Tables<"checklist_template_items">

export type Service = Tables<"services">

export type WarrantyRule = Tables<"warranty_rules">

export type CompanyInvitation = Tables<"company_invitations"> & {
  role: import("@/lib/constants").Role
  status: "pending" | "accepted" | "expired" | "cancelled"
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
  company: Company
}

export interface DashboardMetrics {
  todayRevenue: number
  monthRevenue: number
  grossProfitEstimate: number
  todaySales: number
  monthSales: number
  openServiceOrders: number
  inProgressServiceOrders: number
  pendingApprovalServiceOrders: number
  completedServiceOrders: number
  lowStockProducts: number
  totalCustomers: number
}

export interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
}
