"use client"

import type { Role } from "@/lib/constants"
import { useAuth } from "@/components/providers/auth-provider"

interface RoleGateProps {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuth()
  if (!hasRole(roles)) return <>{fallback}</>
  return <>{children}</>
}

interface FeatureGateProps {
  feature: Parameters<ReturnType<typeof useAuth>["hasFeature"]>[0]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasFeature } = useAuth()
  if (!hasFeature(feature)) return <>{fallback}</>
  return <>{children}</>
}
