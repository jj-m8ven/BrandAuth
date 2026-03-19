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
import { addDistributorSchema } from '@/lib/schemas'
import Link from 'next/link'
import type { AuthorizationStatus, Distributor } from '@/types'

type FilterStatus = 'all' | 'active' | 'pending' | 'revoked' | 'suspended'

const filters: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Revoked', value: 'revoked' },
  { label: 'Suspended', value: 'suspended' },
]

const PLATFORMS = ['amazon', 'ebay', 'tiktok', 'open_web', 'retail', 'wholesale']

export default function VendorListPage() {
  const params = useParams()
  const brandId = params.id as string
  const addToast = useAppStore((s) => s.addToast)

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Add distributor modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    distributor_name: '',
    email: '',
    business_tax_id: '',
    authorization_tier: 'authorized_reseller',
    platforms: [] as string[],
    sku_scope: '',
    seller_id: '',
  })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [addLoading, setAddLoading] = useState(false)

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState<Distributor | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const statusParam = statusFilter === 'all' ? '' : `?status=${statusFilter}`
  const { data: distributors, mutate, isLoading } = useSWR<Distributor[]>(
    `/api/m8ven/api/v1/brand-auth/distributors${statusParam}`,
    fetcher
  )

  const list = distributors ?? []

  // Client-side search filter
  const filtered = search
    ? list.filter(
        (v) =>
          v.distributor_name.toLowerCase().includes(search.toLowerCase()) ||
          v.email.toLowerCase().includes(search.toLowerCase())
      )
    : list

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
      setSelected(new Set(filtered.map((v) => v.distributor_id)))
    }
  }

  const togglePlatform = (platform: string) => {
    setAddForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleAddDistributor = async () => {
    const result = addDistributorSchema.safeParse(addForm)
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
      await apiPost('/api/m8ven/api/v1/brand-auth/distributors', {
        distributor_name: addForm.distributor_name,
        email: addForm.email,
        business_tax_id: addForm.business_tax_id || undefined,
        authorization_tier: addForm.authorization_tier,
        platforms: addForm.platforms,
        sku_scope: addForm.sku_scope || null,
        seller_id: addForm.seller_id || null,
      })
      addToast({ message: 'Distributor added successfully.', type: 'success' })
      setShowAddModal(false)
      setAddForm({
        distributor_name: '', email: '', business_tax_id: '',
        authorization_tier: 'authorized_reseller', platforms: [],
        sku_scope: '', seller_id: '',
      })
      mutate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add distributor.'
      addToast({ message, type: 'error' })
    } finally {
      setAddLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevokeLoading(true)
    try {
      await apiPatch('/api/m8ven/api/v1/brand-auth/distributors', {
        distributor_id: revokeTarget.distributor_id,
        status: 'revoked',
      })
      addToast({ message: `Revoked authorization for ${revokeTarget.distributor_name}.`, type: 'success' })
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
        await apiPatch('/api/m8ven/api/v1/brand-auth/distributors', {
          distributor_id: id,
          status: 'revoked',
        })
      } catch {
        // continue with others
      }
    }
    addToast({ message: `Revoked ${ids.length} distributor(s).`, type: 'success' })
    setSelected(new Set())
    mutate()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Distributors</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Add distributor
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
              onClick={() => setStatusFilter(f.value)}
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
            title={search || statusFilter !== 'all' ? 'No distributors match this filter' : 'No distributors yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'Add your first distributor or share your application link.'
            }
            actionLabel={search || statusFilter !== 'all' ? 'Clear filters' : 'Add distributor'}
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
                <th className="pb-3 pr-4">Distributor</th>
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3 pr-4">Platforms</th>
                <th className="pb-3 pr-4">SKU Scope</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((dist) => (
                <tr key={dist.distributor_id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={selected.has(dist.distributor_id)}
                      onChange={() => toggleSelect(dist.distributor_id)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">{dist.distributor_name}</p>
                    <p className="text-xs text-gray-400">{dist.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <TierBadge tier={dist.authorization_tier} />
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {dist.platforms.join(', ')}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {dist.sku_scope ?? 'All products'}
                  </td>
                  <td className="py-3 pr-4">
                    <AuthorizationBadge status={dist.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/brands/${brandId}/vendors/${dist.distributor_id}`}
                        className="text-xs font-medium text-violet-600 hover:text-violet-500"
                      >
                        View
                      </Link>
                      {dist.status === 'active' && (
                        <button
                          onClick={() => setRevokeTarget(dist)}
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

      {/* Add Distributor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Add distributor</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Distributor name</label>
                <input type="text" value={addForm.distributor_name}
                  onChange={(e) => setAddForm({ ...addForm, distributor_name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                {addErrors.distributor_name && <p className="mt-1 text-xs text-red-600">{addErrors.distributor_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                {addErrors.email && <p className="mt-1 text-xs text-red-600">{addErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Tax ID <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={addForm.business_tax_id}
                  onChange={(e) => setAddForm({ ...addForm, business_tax_id: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Authorization tier</label>
                <select value={addForm.authorization_tier}
                  onChange={(e) => setAddForm({ ...addForm, authorization_tier: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="authorized_reseller">Authorized Reseller</option>
                  <option value="certified_individual">Certified Individual</option>
                </select>
                {addErrors.authorization_tier && <p className="mt-1 text-xs text-red-600">{addErrors.authorization_tier}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Platforms</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                      <input type="checkbox" checked={addForm.platforms.includes(p)}
                        onChange={() => togglePlatform(p)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                      {p.replace('_', ' ')}
                    </label>
                  ))}
                </div>
                {addErrors.platforms && <p className="mt-1 text-xs text-red-600">{addErrors.platforms}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU scope <span className="text-gray-400">(blank = all products)</span></label>
                <input type="text" value={addForm.sku_scope}
                  onChange={(e) => setAddForm({ ...addForm, sku_scope: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">M8ven Seller ID <span className="text-gray-400">(optional, links passport)</span></label>
                <input type="text" value={addForm.seller_id}
                  onChange={(e) => setAddForm({ ...addForm, seller_id: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowAddModal(false); setAddErrors({}) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddDistributor} disabled={addLoading}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {addLoading ? 'Adding...' : 'Add distributor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeTarget && (
        <ConfirmModal
          title="Revoke authorization"
          message={`Revoke authorization for ${revokeTarget.distributor_name}? Their credential will be invalidated within 60 seconds.`}
          confirmLabel={revokeLoading ? 'Revoking...' : 'Revoke'}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
          destructive
        />
      )}
    </div>
  )
}
