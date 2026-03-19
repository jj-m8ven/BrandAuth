export type UserRole = 'brand' | 'vendor'

export type AuthorizationStatus = 'active' | 'pending' | 'revoked' | 'suspended' | 'expired'

export interface Session {
  userId: string
  role: UserRole
  brandId?: string
  passportId?: string
  accessToken: string
  expiresAt: number
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export interface Brand {
  id: string
  slug: string
  name: string
  domain: string
  logoUrl?: string
  categories: string[]
  status: string
  authorization_tiers?: Tier[]
}

export interface Distributor {
  distributor_id: string
  distributor_name: string
  email: string
  business_tax_id?: string
  authorization_tier: string
  platforms: string[]
  sku_scope: string | null
  status: AuthorizationStatus
  seller_id?: string
  passport_url?: string
  created_at: string
  updated_at?: string
}

export interface Authorization {
  authorized: boolean
  distributor_id: string
  brand_name: string
  authorization_tier: string
  sku_scope: string | null
  platforms: string[]
  passport_url?: string
}

export interface Application {
  id: string
  brand_id: string
  distributor_name: string
  email: string
  business_tax_id?: string
  passport_score?: number
  authorization_tier: string
  platforms: string[]
  sku_scope: string | null
  message?: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
}

export interface Tier {
  id: string
  label: string
}

export interface ApiKey {
  id: string
  name: string
  createdAt: string
  lastUsedAt?: string
  usageCount: number
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  createdAt: string
}

export interface ActivityEvent {
  id: string
  action: 'granted' | 'revoked' | 'applied' | 'suspended'
  distributor_name: string
  timestamp: string
}

export interface BrandStats {
  totalDistributors: number
  pendingApplications: number
  activeApiKeys: number
  checksThisMonth: number
}

export interface UsageStats {
  period: string
  auth_check_count: number
  response_times: {
    avg_ms: number
    p95_ms: number
  }
  daily_breakdown: {
    date: string
    count: number
  }[]
}

export interface ApiError {
  error: string
  code: string
}
