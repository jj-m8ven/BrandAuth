'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiPost, apiPatch } from '@/lib/fetcher'
import { AuthorizationBadge } from '@/components/ui/AuthorizationBadge'
import { TierBadge } from '@/components/ui/TierBadge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAppStore } from '@/stores/appStore'
import { addVendorSchema } from '@/lib/schemas'
import Link from 'next/link'
import type { AuthorizationStatus } from '@/types'

interface VendorRow {
  id: string
  name: string
  email: string
  tier: string
  channels: string[]
  authorizedAt: string
  status: AuthorizationStatus
}

interface VendorListResponse {
  data: VendorRow[]
  total: number
  page: number
  limit: number
}

type FilterStatus = 'all' | 'authorized' | 'pending' | 'revoked' | 'suspended'

const filters: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Authorized', value: 'authorized' },
  { label: 'Pending', value: 'pending' },
  { label: 'Revoked', value: 'revoked' },
  { label: 'Suspended', value: 'suspended' },
]

export default function VendorListPage() {
  const params = useParams()
  const brandId = params.id as string
  const addToast = useAppStore((s) => s.addToast)

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Add vendor modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', tier: '', skuScope: '' })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [addLoading, setAddLoading] = useState(false)

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState<VendorRow | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`
  const { data, mutate, isLoading } = useSWR<VendorListResponse>(
    `/api/m8ven/brands/${brandId}/distributors?page=${page}&limit=50${statusParam}`,
    fetcher
  )

  const vendors = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 50)

  // Client-side search filter
  const filtered = search
    ? vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.email.toLowerCase().includes(search.toLowerCase())
      )
    : vendors

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((v) => v.id)))
    }
  }

  const handleAddVendor = async () => {
    const result = addVendorSchema.safeParse(addForm)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[issue.path[0] as string] = issue.message
      }
      setAddErrors(errs)
      return
    }
    setAddErrors({})
    setAddLoading(true)

    try {
      await apiPost(`/api/m8ven/brands/${brandId}/distributors`, {
        email: addForm.email,
        tier: addForm.tier,
        skuScope: addForm.skuScope || undefined,
      })
      addToast({ message: 'Vendor added successfully.', type: 'success' })
      setShowAddModal(false)
      setAddForm({ email: '', tier: '', skuScope: '' })
      mutate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add vendor.'
      addToast({ message, type: 'error' })
    } finally {
      setAddLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevokeLoading(true)
    try {
      await apiPatch(`/api/m8ven/brands/${brandId}/distributors/${revokeTarget.id}`, {
        status: 'revoked',
      })
      addToast({ message: `Revoked authorization for ${revokeTarget.name}.`, type: 'success' })
      setRevokeTarget(null)
      mutate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke.'
      addToast({ message, type: 'error' })
    } finally {
      setRevokeLoading(false)
    }
  }

  const handleBulkRevoke = async () => {
    const ids = Array.from(selected)
    for (const id of ids) {
      try {
        await apiPatch(`/api/m8ven/brands/${brandId}/distributors/${id}`, {
          status: 'revoked',
        })
      } catch {
        // continue with others
      }
    }
    addToast({ message: `Revoked ${ids.length} vendor(s).`, type: 'success' })
    setSelected(new Set())
    mutate()
  }

  const handleExportCSV = () => {
    window.open(`/api/m8ven/brands/${brandId}/distributors?format=csv`, '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Vendors</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Add vendor
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value)
                setPage(1)
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === f.value
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportCSV}
          className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-violet-50 px-4 py-2">
          <span className="text-sm text-violet-700">{selected.size} selected</span>
          <button
            onClick={handleBulkRevoke}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Bulk revoke
          </button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={search || statusFilter !== 'all' ? 'No vendors match this filter' : 'No vendors yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'Add your first vendor or share your application link.'
            }
            actionLabel={search || statusFilter !== 'all' ? 'Clear filters' : 'Add vendor'}
            onAction={() => {
              if (search || statusFilter !== 'all') {
                setSearch('')
                setStatusFilter('all')
              } else {
                setShowAddModal(true)
              }
            }}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="pb-3 pr-4">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                </th>
                <th className="pb-3 pr-4">Vendor</th>
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3 pr-4">Channels</th>
                <th className="pb-3 pr-4">Authorized since</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={selected.has(vendor.id)}
                      onChange={() => toggleSelect(vendor.id)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <p className="text-xs text-gray-400">{vendor.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <TierBadge tier={vendor.tier} />
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {vendor.channels.join(', ')}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {new Date(vendor.authorizedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td className="py-3 pr-4">
                    <AuthorizationBadge status={vendor.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/brands/${brandId}/vendors/${vendor.id}`}
                        className="text-xs font-medium text-violet-600 hover:text-violet-500"
                      >
                        View
                      </Link>
                      {vendor.status === 'authorized' && (
                        <button
                          onClick={() => setRevokeTarget(vendor)}
                          className="text-xs font-medium text-red-600 hover:text-red-500"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages} ({total} vendors)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Add vendor</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {addErrors.email && <p className="mt-1 text-xs text-red-600">{addErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tier</label>
                <input
                  type="text"
                  value={addForm.tier}
                  onChange={(e) => setAddForm({ ...addForm, tier: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {addErrors.tier && <p className="mt-1 text-xs text-red-600">{addErrors.tier}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SKU scope <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addForm.skuScope}
                  onChange={(e) => setAddForm({ ...addForm, skuScope: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setAddErrors({})
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVendor}
                disabled={addLoading}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {addLoading ? 'Adding...' : 'Add vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeTarget && (
        <ConfirmModal
          title="Revoke authorization"
          message={`Revoke authorization for ${revokeTarget.name}? Their credential will be invalidated within 60 seconds.`}
          confirmLabel={revokeLoading ? 'Revoking...' : 'Revoke'}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
          destructive
        />
      )}
    </div>
  )
}
