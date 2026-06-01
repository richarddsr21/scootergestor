"use client"

import * as React from "react"
import type { Profile, Company } from "@/types/app"
import type { Role } from "@/lib/constants"
import { hasFeature, getLimit } from "@/lib/plans"
import type { PlanFeatures, PlanLimits } from "@/lib/plans"

interface AuthContextValue {
  profile: Profile
  company: Company
  isOwner: boolean
  isAdmin: boolean
  isManager: boolean
  isTechnician: boolean
  isSeller: boolean
  isCashier: boolean
  hasRole: (roles: Role[]) => boolean
  canManageUsers: boolean
  hasFeature: (feature: keyof PlanFeatures) => boolean
  getLimit: (limit: keyof PlanLimits) => number
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({
  profile,
  company,
  children,
}: {
  profile: Profile
  company: Company
  children: React.ReactNode
}) {
  const role = profile.role as Role
  const plan = company.plan

  const value: AuthContextValue = {
    profile,
    company,
    isOwner: role === "owner",
    isAdmin: role === "owner" || role === "admin",
    isManager: role === "owner" || role === "admin" || role === "manager",
    isTechnician: role === "technician",
    isSeller: role === "seller",
    isCashier: role === "cashier",
    canManageUsers: role === "owner" || role === "admin",
    hasRole: (roles) => roles.includes(role),
    hasFeature: (feature) => hasFeature(plan, feature),
    getLimit: (limit) => getLimit(plan, limit),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
