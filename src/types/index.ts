export type UserRole = 'brand' | 'vendor'

export type AuthorizationStatus = 'authorized' | 'pending' | 'revoked' | 'suspended' | 'expired'

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
}

export interface Vendor {
  id: string
  name: string
  email: string
  passportId: string
  passportScore?: number
}

export interface Authorization {
  id: string
  brandId: string
  brandName: string
  brandLogoUrl?: string
  vendorId: string
  vendorName: string
  tier: string
  channels: string[]
  status: AuthorizationStatus
  authorizedAt: string
  expiresAt?: string
}

export interface Application {
  id: string
  brandId: string
  vendorId: string
  vendorName: string
  passportScore?: number
  tier: string
  channels: string[]
  skuScope?: string
  message?: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}

export interface Tier {
  id: string
  name: string
  description: string
  channels: string[]
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
  vendorName: string
  timestamp: string
}

export interface BrandStats {
  totalVendors: number
  pendingApplications: number
  activeApiKeys: number
  credentialsThisMonth: number
}

export interface ApiError {
  error: string
  code: string
}
