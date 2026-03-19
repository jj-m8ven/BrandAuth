'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiPatch } from '@/lib/fetcher'
import { AuthorizationBadge } from '@/components/ui/AuthorizationBadge'
import { TierBadge } from '@/components/ui/TierBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useAppStore } from '@/stores/appStore'
import type { Distributor } from '@/types'

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const addToast = useAppStore((s) => s.addToast)
  const brandId = params.id as string
  const vid = params.vid as string

  // Fetch all distributors and find the one we need
  // (M8ven API doesn't have a single-distributor GET endpoint)
  const { data: distributors, mutate } = useSWR<Distributor[]>(
    `/api/m8ven/api/v1/brand-auth/distributors`,
    fetcher
  )

  const distributor = distributors?.find((d) => d.distributor_id === vid)

  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const handleRevoke = async () => {
    setRevokeLoading(true)
    try {
      await apiPatch('/api/m8ven/api/v1/brand-auth/distributors', {
        distributor_id: vid,
        status: 'revoked',
      })
      addToast({ message: 'Authorization revoked.', type: 'success' })
      setRevokeOpen(false)
      mutate()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to revoke.',
        type: 'error',
      })
    } finally {
      setRevokeLoading(false)
    }
  }

  const handleSuspend = async () => {
    try {
      await apiPatch('/api/m8ven/api/v1/brand-auth/distributors', {
        distributor_id: vid,
        status: 'suspended',
      })
      addToast({ message: 'Distributor suspended.', type: 'success' })
      mutate()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to suspend.',
        type: 'error',
      })
    }
  }

  if (!distributor) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm font-medium text-violet-600 hover:text-violet-500"
      >
        &larr; Back to distributors
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{distributor.distributor_name}</h1>
          <p className="mt-1 text-sm text-gray-500">{distributor.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <AuthorizationBadge status={distributor.status} />
            <TierBadge tier={distributor.authorization_tier} />
          </div>
        </div>
        <div className="flex gap-2">
          {distributor.status === 'active' && (
            <>
              <button
                onClick={handleSuspend}
                className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50"
              >
                Suspend
              </button>
              <button
                onClick={() => setRevokeOpen(true)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Revoke
              </button>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Authorization Details
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Distributor ID</dt>
              <dd className="font-mono font-medium text-gray-900">{distributor.distributor_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Platforms</dt>
              <dd className="font-medium text-gray-900 capitalize">{distributor.platforms.join(', ').replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">SKU Scope</dt>
              <dd className="font-medium text-gray-900">{distributor.sku_scope ?? 'All products'}</dd>
            </div>
            {distributor.business_tax_id && (
              <div>
                <dt className="text-gray-500">Business Tax ID</dt>
                <dd className="font-medium text-gray-900">{distributor.business_tax_id}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Added</dt>
              <dd className="font-medium text-gray-900">
                {new Date(distributor.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </dd>
            </div>
            {distributor.passport_url && (
              <div>
                <dt className="text-gray-500">M8ven Passport</dt>
                <dd>
                  <a href={distributor.passport_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-violet-600 hover:text-violet-500">
                    View passport &rarr;
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Verification Link
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Share this link to let anyone verify this distributor&apos;s authorization.
          </p>
          <div className="mt-3">
            <CopyButton text={`${appUrl}/verify/${brandId}/${distributor.distributor_id}`} label="Copy link" />
          </div>

          {distributor.seller_id && (
            <div className="mt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Badge Embed
              </h2>
              <div className="mt-3">
                <CopyButton
                  text={`<a href="${appUrl}/verify/${brandId}/${distributor.distributor_id}"><img src="${process.env.NEXT_PUBLIC_M8VEN_API_URL}/brands/${brandId}/badge/${distributor.distributor_id}" alt="Authorized Distributor" /></a>`}
                  label="Copy embed code"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {revokeOpen && (
        <ConfirmModal
          title="Revoke authorization"
          message={`Revoke authorization for ${distributor.distributor_name}? Their credential will be invalidated within 60 seconds.`}
          confirmLabel={revokeLoading ? 'Revoking...' : 'Revoke'}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeOpen(false)}
          destructive
        />
      )}
    </div>
  )
}
