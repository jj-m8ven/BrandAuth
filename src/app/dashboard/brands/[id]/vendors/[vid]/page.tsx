'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiPatch } from '@/lib/fetcher'
import { AuthorizationBadge } from '@/components/ui/AuthorizationBadge'
import { TierBadge } from '@/components/ui/TierBadge'
import { M8venPassportBadge } from '@/components/ui/M8venPassportBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useAppStore } from '@/stores/appStore'
import type { AuthorizationStatus } from '@/types'

interface VendorDetail {
  id: string
  name: string
  email: string
  passportId?: string
  passportScore?: number
  tier: string
  channels: string[]
  skuScope?: string
  status: AuthorizationStatus
  authorizedAt: string
  expiresAt?: string
  history: {
    id: string
    action: string
    timestamp: string
    note?: string
  }[]
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const addToast = useAppStore((s) => s.addToast)
  const brandId = params.id as string
  const vid = params.vid as string

  const { data: vendor, mutate } = useSWR<VendorDetail>(
    `/api/m8ven/brands/${brandId}/distributors/${vid}`,
    fetcher
  )

  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const handleRevoke = async () => {
    setRevokeLoading(true)
    try {
      await apiPatch(`/api/m8ven/brands/${brandId}/distributors/${vid}`, {
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
      await apiPatch(`/api/m8ven/brands/${brandId}/distributors/${vid}`, {
        status: 'suspended',
      })
      addToast({ message: 'Vendor suspended.', type: 'success' })
      mutate()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to suspend.',
        type: 'error',
      })
    }
  }

  if (!vendor) {
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
        &larr; Back to vendors
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{vendor.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <AuthorizationBadge status={vendor.status} />
            <TierBadge tier={vendor.tier} />
            {vendor.passportScore != null && (
              <M8venPassportBadge score={vendor.passportScore} />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {vendor.status === 'authorized' && (
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
              <dt className="text-gray-500">Channels</dt>
              <dd className="font-medium text-gray-900">{vendor.channels.join(', ')}</dd>
            </div>
            {vendor.skuScope && (
              <div>
                <dt className="text-gray-500">SKU Scope</dt>
                <dd className="font-medium text-gray-900">{vendor.skuScope}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Authorized since</dt>
              <dd className="font-medium text-gray-900">
                {new Date(vendor.authorizedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </dd>
            </div>
            {vendor.expiresAt && (
              <div>
                <dt className="text-gray-500">Expires</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(vendor.expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </dd>
              </div>
            )}
            {vendor.passportId && (
              <div>
                <dt className="text-gray-500">M8ven Passport</dt>
                <dd className="font-medium text-gray-900">{vendor.passportId}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Verification Link
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Share this link to let anyone verify this vendor&apos;s authorization.
          </p>
          <div className="mt-3">
            <CopyButton text={`${appUrl}/verify/${brandId}/${vendor.id}`} label="Copy link" />
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">History</h2>
        {vendor.history.length > 0 ? (
          <div className="mt-4 space-y-3">
            {vendor.history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900 capitalize">{entry.action}</span>
                  {entry.note && <span className="ml-2 text-gray-500">&mdash; {entry.note}</span>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No history recorded yet.</p>
        )}
      </div>

      {revokeOpen && (
        <ConfirmModal
          title="Revoke authorization"
          message={`Revoke authorization for ${vendor.name}? Their credential will be invalidated within 60 seconds.`}
          confirmLabel={revokeLoading ? 'Revoking...' : 'Revoke'}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeOpen(false)}
          destructive
        />
      )}
    </div>
  )
}
