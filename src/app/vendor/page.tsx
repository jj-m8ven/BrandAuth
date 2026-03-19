'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { AuthorizationBadge } from '@/components/ui/AuthorizationBadge'
import { TierBadge } from '@/components/ui/TierBadge'
import { M8venPassportBadge } from '@/components/ui/M8venPassportBadge'
import Link from 'next/link'
import type { Brand } from '@/types'

interface VendorProfile {
  name: string
  passportId: string
  passportScore?: number
}

interface DistributorCredential {
  distributor_id: string
  distributor_name: string
  brand_name: string
  authorization_tier: string
  platforms: string[]
  sku_scope: string | null
  status: 'active' | 'revoked' | 'suspended' | 'pending'
  created_at: string
  expires_at?: string
}

export default function VendorDashboard() {
  const { data: profile } = useSWR<VendorProfile>('/api/m8ven/vendors/me', fetcher)
  const { data: authorizations } = useSWR<DistributorCredential[]>(
    '/api/m8ven/vendors/me/authorizations',
    fetcher
  )

  const [brandSearch, setBrandSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: discoverBrands } = useSWR<Brand[]>(
    `/api/m8ven/brands?accepting_applications=true${categoryFilter ? `&category=${categoryFilter}` : ''}`,
    fetcher
  )

  const filteredBrands = discoverBrands?.filter((b) =>
    !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">BrandGraph</Link>
          <span className="text-sm text-gray-500">Vendor Portal</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Profile header */}
        {profile ? (
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                {profile.passportScore != null && (
                  <M8venPassportBadge score={profile.passportScore} />
                )}
                <span className="text-xs text-gray-400">Passport: {profile.passportId}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-12 w-64 animate-pulse rounded bg-gray-100" />
        )}

        {/* Credentials */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Your Authorizations
        </h2>

        {!authorizations ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : authorizations.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-gray-900">You have no authorizations yet</p>
            <p className="mt-1 text-sm text-gray-500">Find a brand below to apply to.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authorizations.map((auth) => (
              <Link
                key={auth.distributor_id}
                href={`/vendor/credentials/${auth.distributor_id}`}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-600">
                    {auth.brand_name.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-900">{auth.brand_name}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AuthorizationBadge status={auth.status} />
                  <TierBadge tier={auth.authorization_tier} />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p>Platforms: {auth.platforms.join(', ')}</p>
                  <p>
                    Since{' '}
                    {new Date(auth.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                  {auth.expires_at && (
                    <p>
                      Expires{' '}
                      {new Date(auth.expires_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Discover brands */}
        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Discover Brands
        </h2>
        <p className="mt-1 text-sm text-gray-500">Find brands to apply to.</p>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="Search brands..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All categories</option>
            <option value="apparel">Apparel & Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="beauty">Beauty & Personal Care</option>
            <option value="home">Home & Garden</option>
            <option value="sports">Sports & Outdoors</option>
          </select>
        </div>

        {filteredBrands && filteredBrands.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="h-8 w-8 rounded-lg object-contain" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-600">
                      {brand.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                    <p className="text-xs text-gray-400">{brand.categories.join(', ')}</p>
                  </div>
                </div>
                <Link
                  href={`/vendor/apply/${brand.slug}`}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                >
                  Apply
                </Link>
              </div>
            ))}
          </div>
        ) : filteredBrands ? (
          <p className="mt-4 text-sm text-gray-400">No brands found matching your search.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
