'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiPatch } from '@/lib/fetcher'
import { M8venPassportBadge } from '@/components/ui/M8venPassportBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAppStore } from '@/stores/appStore'
import type { Application } from '@/types'

type Tab = 'pending' | 'approved' | 'denied'

interface ApplicationsResponse {
  data: Application[]
  count: number
}

export default function ApplicationsPage() {
  const params = useParams()
  const brandId = params.id as string
  const addToast = useAppStore((s) => s.addToast)
  const [tab, setTab] = useState<Tab>('pending')

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState<Application | null>(null)
  const [approveTier, setApproveTier] = useState('')
  const [approveSkuScope, setApproveSkuScope] = useState('')
  const [approveExpiry, setApproveExpiry] = useState('')
  const [approveLoading, setApproveLoading] = useState(false)

  // Deny modal state
  const [denyTarget, setDenyTarget] = useState<Application | null>(null)
  const [denyReason, setDenyReason] = useState('')
  const [denyLoading, setDenyLoading] = useState(false)

  // Request info modal state
  const [infoTarget, setInfoTarget] = useState<Application | null>(null)
  const [infoMessage, setInfoMessage] = useState('')
  const [infoLoading, setInfoLoading] = useState(false)

  const { data, mutate, isLoading } = useSWR<ApplicationsResponse>(
    `/api/m8ven/brands/${brandId}/applications?status=${tab}`,
    fetcher,
    { refreshInterval: tab === 'pending' ? 60000 : 0 }
  )

  const applications = data?.data ?? []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  const handleApprove = async () => {
    if (!approveTarget) return
    setApproveLoading(true)
    try {
      await apiPatch(`/api/m8ven/applications/${approveTarget.id}`, {
        status: 'approved',
        tier: approveTier || approveTarget.tier,
        skuScope: approveSkuScope || undefined,
        expiresAt: approveExpiry || undefined,
      })
      addToast({ message: `Approved ${approveTarget.vendorName}.`, type: 'success' })
      setApproveTarget(null)
      setApproveTier('')
      setApproveSkuScope('')
      setApproveExpiry('')
      mutate()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Could not approve application. Try again.',
        type: 'error',
      })
    } finally {
      setApproveLoading(false)
    }
  }

  const handleDeny = async () => {
    if (!denyTarget) return
    setDenyLoading(true)
    try {
      await apiPatch(`/api/m8ven/applications/${denyTarget.id}`, {
        status: 'denied',
        message: denyReason || undefined,
      })
      addToast({ message: `Denied ${denyTarget.vendorName}.`, type: 'success' })
      setDenyTarget(null)
      setDenyReason('')
      mutate()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Could not deny application. Try again.',
        type: 'error',
      })
    } finally {
      setDenyLoading(false)
    }
  }

  const handleRequestInfo = async () => {
    if (!infoTarget || !infoMessage.trim()) return
    setInfoLoading(true)
    try {
      await apiPatch(`/api/m8ven/applications/${infoTarget.id}`, {
        status: 'pending',
        message: infoMessage,
      })
      addToast({ message: `Requested info from ${infoTarget.vendorName}.`, type: 'success' })
      setInfoTarget(null)
      setInfoMessage('')
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to send request. Try again.',
        type: 'error',
      })
    } finally {
      setInfoLoading(false)
    }
  }

  const openApprove = (app: Application) => {
    setApproveTarget(app)
    setApproveTier(app.tier)
    setApproveSkuScope(app.skuScope || '')
    setApproveExpiry('')
  }

  const tabs: { label: string; value: Tab }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Denied', value: 'denied' },
  ]

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Applications</h1>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.value
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.value === 'pending' && data?.count != null && data.count > 0 && (
              <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                {data.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-6">
          {tab === 'pending' ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-gray-900">No pending applications</p>
              <p className="mt-1 text-sm text-gray-500">
                Share your application link to invite vendors.
              </p>
              <div className="mt-4">
                <CopyButton
                  text={`${appUrl}/brands/${brandId}/apply`}
                  label="Copy application link"
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title={`No ${tab} applications`}
              description={`Applications you've ${tab} will appear here.`}
            />
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{app.vendorName}</h3>
                    {app.passportScore != null && (
                      <M8venPassportBadge score={app.passportScore} />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span>Tier: {app.tier}</span>
                    <span>&middot;</span>
                    <span>Channels: {app.channels.join(', ')}</span>
                    {app.skuScope && (
                      <>
                        <span>&middot;</span>
                        <span>SKU: {app.skuScope}</span>
                      </>
                    )}
                  </div>
                  {app.message && (
                    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Applied{' '}
                    {new Date(app.createdAt).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>

                {tab === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openApprove(app)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDenyTarget(app)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => setInfoTarget(app)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Request info
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Approve {approveTarget.vendorName}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tier</label>
                <input
                  type="text"
                  value={approveTier}
                  onChange={(e) => setApproveTier(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SKU scope <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={approveSkuScope}
                  onChange={(e) => setApproveSkuScope(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry date <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={approveExpiry}
                  onChange={(e) => setApproveExpiry(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setApproveTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approveLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Deny {denyTarget.vendorName}
            </h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Reason <span className="text-gray-400">(internal only)</span>
              </label>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDenyTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeny}
                disabled={denyLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {denyLoading ? 'Denying...' : 'Deny'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {infoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Request info from {infoTarget.vendorName}
            </h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                rows={3}
                placeholder="What additional information do you need?"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setInfoTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfo}
                disabled={infoLoading || !infoMessage.trim()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {infoLoading ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
