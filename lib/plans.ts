import type { Plan } from "./constants"

export interface PlanLimits {
  maxUsers: number
  maxProducts: number
  maxCustomers: number
  maxServiceOrdersPerMonth: number
  maxUnits: number
}

export interface PlanFeatures {
  customChecklist: boolean
  customStatuses: boolean
  customTheme: boolean
  whatsappTemplates: boolean
  advancedReports: boolean
  serviceOrderPhotos: boolean
  pdfExport: boolean
  suppliers: boolean
  purchases: boolean
  advancedWarranty: boolean
  advancedPermissions: boolean
  pdv: boolean
  financialModule: boolean
  multipleUnits: boolean
}

export interface PlanConfig {
  id: Plan
  name: string
  price: number
  setupFee: number
  limits: PlanLimits
  features: PlanFeatures
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  start: {
    id: "start",
    name: "Start",
    price: 197,
    setupFee: 497,
    limits: {
      maxUsers: 2,
      maxProducts: 300,
      maxCustomers: 300,
      maxServiceOrdersPerMonth: 100,
      maxUnits: 1,
    },
    features: {
      customChecklist: false,
      customStatuses: false,
      customTheme: false,
      whatsappTemplates: false,
      advancedReports: false,
      serviceOrderPhotos: false,
      pdfExport: false,
      suppliers: false,
      purchases: false,
      advancedWarranty: false,
      advancedPermissions: false,
      pdv: false,
      financialModule: true,
      multipleUnits: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 297,
    setupFee: 797,
    limits: {
      maxUsers: 5,
      maxProducts: 1500,
      maxCustomers: 2000,
      maxServiceOrdersPerMonth: 500,
      maxUnits: 1,
    },
    features: {
      customChecklist: true,
      customStatuses: true,
      customTheme: false,
      whatsappTemplates: true,
      advancedReports: false,
      serviceOrderPhotos: false,
      pdfExport: false,
      suppliers: false,
      purchases: false,
      advancedWarranty: true,
      advancedPermissions: false,
      pdv: true,
      financialModule: true,
      multipleUnits: false,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 497,
    setupFee: 1497,
    limits: {
      maxUsers: 10,
      maxProducts: 5000,
      maxCustomers: 10000,
      maxServiceOrdersPerMonth: 1500,
      maxUnits: 2,
    },
    features: {
      customChecklist: true,
      customStatuses: true,
      customTheme: true,
      whatsappTemplates: true,
      advancedReports: true,
      serviceOrderPhotos: true,
      pdfExport: true,
      suppliers: true,
      purchases: true,
      advancedWarranty: true,
      advancedPermissions: true,
      pdv: true,
      financialModule: true,
      multipleUnits: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    setupFee: 0,
    limits: {
      maxUsers: Infinity,
      maxProducts: Infinity,
      maxCustomers: Infinity,
      maxServiceOrdersPerMonth: Infinity,
      maxUnits: Infinity,
    },
    features: {
      customChecklist: true,
      customStatuses: true,
      customTheme: true,
      whatsappTemplates: true,
      advancedReports: true,
      serviceOrderPhotos: true,
      pdfExport: true,
      suppliers: true,
      purchases: true,
      advancedWarranty: true,
      advancedPermissions: true,
      pdv: true,
      financialModule: true,
      multipleUnits: true,
    },
  },
}

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIGS[plan]
}

export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  return PLAN_CONFIGS[plan].features[feature]
}

export function getLimit(plan: Plan, limit: keyof PlanLimits): number {
  return PLAN_CONFIGS[plan].limits[limit]
}

export function getPlanThatUnlocksFeature(feature: keyof PlanFeatures): Plan | null {
  const order: Plan[] = ["start", "pro", "premium", "enterprise"]
  return order.find((plan) => PLAN_CONFIGS[plan].features[feature]) ?? null
}

export function getPlanThatUnlocksLimit(limit: keyof PlanLimits, value: number): Plan | null {
  const order: Plan[] = ["start", "pro", "premium", "enterprise"]
  return order.find((plan) => PLAN_CONFIGS[plan].limits[limit] >= value) ?? null
}
