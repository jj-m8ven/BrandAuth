'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/fetcher'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { CopyButton } from '@/components/ui/CopyButton'
import { useAppStore } from '@/stores/appStore'
import { tierSchema, webhookSchema } from '@/lib/schemas'
import type { Tier, ApiKey, Webhook, Brand } from '@/types'

type Tab = 'tiers' | 'apikeys' | 'webhooks' | 'profile'

const tabs: { label: string; value: Tab }[] = [
  { label: 'Tiers', value: 'tiers' },
  { label: 'API Keys', value: 'apikeys' },
  { label: 'Webhooks', value: 'webhooks' },
  { label: 'Profile', value: 'profile' },
]

export default function BrandSettingsPage() {
  const params = useParams()
  const brandId = params.id as string
  const [tab, setTab] = useState<Tab>('tiers')

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Settings</h1>

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
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'tiers' && <TiersTab brandId={brandId} />}
        {tab === 'apikeys' && <ApiKeysTab brandId={brandId} />}
        {tab === 'webhooks' && <WebhooksTab brandId={brandId} />}
        {tab === 'profile' && <ProfileTab brandId={brandId} />}
      </div>
    </div>
  )
}

// ── Tiers Tab ──

function TiersTab({ brandId }: { brandId: string }) {
  const addToast = useAppStore((s) => s.addToast)
  const { data: tiers, mutate } = useSWR<Tier[]>(
    `/api/m8ven/brands/${brandId}/tiers`,
    fetcher
  )
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', channels: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tier | null>(null)

  const handleAdd = async () => {
    const channels = form.channels.split(',').map((c) => c.trim()).filter(Boolean)
    const result = tierSchema.safeParse({ name: form.name, description: form.description, channels })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) errs[issue.path[0] as string] = issue.message
      setErrors(errs)
      return
    }

    if (tiers && tiers.length >= 5) {
      addToast({ message: "You've reached the maximum of 5 tiers. Delete an existing tier to add a new one.", type: 'error' })
      return
    }

    setLoading(true)
    try {
      await apiPost(`/api/m8ven/brands/${brandId}/tiers`, { name: form.name, description: form.description, channels })
      addToast({ message: 'Tier created.', type: 'success' })
      setShowAdd(false)
      setForm({ name: '', description: '', channels: '' })
      setErrors({})
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to create tier.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiDelete(`/api/m8ven/brands/${brandId}/tiers/${deleteTarget.id}`)
      addToast({ message: 'Tier deleted.', type: 'success' })
      setDeleteTarget(null)
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to delete tier.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Configure authorization tiers for your vendors.</p>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Add tier
        </button>
      </div>

      {!tiers ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No tiers configured yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{tier.name}</p>
                <p className="text-xs text-gray-500">{tier.description}</p>
                <p className="mt-1 text-xs text-gray-400">Channels: {tier.channels.join(', ')}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(tier)}
                className="text-xs font-medium text-red-600 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Add tier</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Channels (comma-separated)</label>
                <input type="text" placeholder="Amazon, TikTok, Own site" value={form.channels}
                  onChange={(e) => setForm({ ...form, channels: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                {errors.channels && <p className="mt-1 text-xs text-red-600">{errors.channels}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowAdd(false); setErrors({}) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={loading}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create tier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete tier"
          message={`Delete tier "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          destructive
        />
      )}
    </div>
  )
}

// ── API Keys Tab ──

function ApiKeysTab({ brandId }: { brandId: string }) {
  const addToast = useAppStore((s) => s.addToast)
  const { data: keys, mutate } = useSWR<ApiKey[]>(
    `/api/m8ven/brands/${brandId}/api-keys`,
    fetcher
  )
  const [showCreate, setShowCreate] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)

  const handleCreate = async () => {
    if (!keyName.trim()) return
    setLoading(true)
    try {
      const res = await apiPost<{ key: string }>(`/api/m8ven/brands/${brandId}/api-keys`, { name: keyName })
      setNewKey(res.key)
      setKeyName('')
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to create key.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    try {
      await apiDelete(`/api/m8ven/brands/${brandId}/api-keys/${revokeTarget.id}`)
      addToast({ message: 'API key revoked.', type: 'success' })
      setRevokeTarget(null)
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to revoke key.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Manage API keys for programmatic access.</p>
        <button onClick={() => setShowCreate(true)}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">
          Create key
        </button>
      </div>

      {!keys ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No API keys created yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3 pr-4">Last used</th>
                <th className="pb-3 pr-4">Usage</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="py-3 pr-4 font-medium text-gray-900">{key.name}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {new Date(key.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Never'}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{key.usageCount}</td>
                  <td className="py-3">
                    <button onClick={() => setRevokeTarget(key)}
                      className="text-xs font-medium text-red-600 hover:text-red-500">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create key modal */}
      {showCreate && !newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Create API key</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Key name</label>
              <input type="text" value={keyName} onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={loading || !keyName.trim()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show new key modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Your new API key</h3>
            <p className="mt-2 text-sm text-gray-500">
              Copy this key now. You won&apos;t be able to see it again.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <code className="break-all text-sm text-gray-900">{newKey}</code>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <CopyButton text={newKey} label="Copy key" />
              <button onClick={() => { setNewKey(null); setShowCreate(false) }}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">Done</button>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <ConfirmModal title="Revoke API key" message={`Revoke "${revokeTarget.name}"? This cannot be undone.`}
          confirmLabel="Revoke" onConfirm={handleRevoke} onCancel={() => setRevokeTarget(null)} destructive />
      )}
    </div>
  )
}

// ── Webhooks Tab ──

const WEBHOOK_EVENTS = [
  'authorization.granted',
  'authorization.revoked',
  'application.received',
]

function WebhooksTab({ brandId }: { brandId: string }) {
  const addToast = useAppStore((s) => s.addToast)
  const { data: webhooks, mutate } = useSWR<Webhook[]>(
    `/api/m8ven/brands/${brandId}/webhooks`,
    fetcher
  )
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ url: '', events: [] as string[] })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null)
  const [testing, setTesting] = useState<string | null>(null)

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const handleAdd = async () => {
    const result = webhookSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) errs[issue.path[0] as string] = issue.message
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await apiPost(`/api/m8ven/brands/${brandId}/webhooks`, form)
      addToast({ message: 'Webhook added.', type: 'success' })
      setShowAdd(false)
      setForm({ url: '', events: [] })
      setErrors({})
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to add webhook.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async (whId: string) => {
    setTesting(whId)
    try {
      await apiPost(`/api/m8ven/brands/${brandId}/webhooks/${whId}/test`, {})
      addToast({ message: 'Test webhook sent successfully.', type: 'success' })
    } catch {
      addToast({ message: 'Webhook test failed — check the URL is reachable and returns 200.', type: 'error' })
    } finally {
      setTesting(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiDelete(`/api/m8ven/brands/${brandId}/webhooks/${deleteTarget.id}`)
      addToast({ message: 'Webhook deleted.', type: 'success' })
      setDeleteTarget(null)
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to delete webhook.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Receive notifications when authorization events occur.</p>
        <button onClick={() => setShowAdd(true)}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">
          Add endpoint
        </button>
      </div>

      {!webhooks ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No webhook endpoints configured.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm break-all">{wh.url}</p>
                  <p className="mt-1 text-xs text-gray-400">{wh.events.join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                    className="text-xs font-medium text-violet-600 hover:text-violet-500 disabled:opacity-50">
                    {testing === wh.id ? 'Testing...' : 'Test'}
                  </button>
                  <button onClick={() => setDeleteTarget(wh)}
                    className="text-xs font-medium text-red-600 hover:text-red-500">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Add webhook endpoint</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input type="url" placeholder="https://your-server.com/webhook" value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Events</label>
                <div className="mt-2 space-y-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={form.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                      {event}
                    </label>
                  ))}
                </div>
                {errors.events && <p className="mt-1 text-xs text-red-600">{errors.events}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowAdd(false); setErrors({}) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={loading}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {loading ? 'Adding...' : 'Add endpoint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal title="Delete webhook" message={`Delete webhook for ${deleteTarget.url}?`}
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} destructive />
      )}
    </div>
  )
}

// ── Profile Tab ──

function ProfileTab({ brandId }: { brandId: string }) {
  const addToast = useAppStore((s) => s.addToast)
  const { data: brand, mutate } = useSWR<Brand>(
    `/api/m8ven/brands/${brandId}`,
    fetcher
  )
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', domain: '', categories: '' })
  const [loading, setLoading] = useState(false)

  const startEdit = () => {
    if (!brand) return
    setForm({
      name: brand.name,
      domain: brand.domain,
      categories: brand.categories.join(', '),
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await apiPatch(`/api/m8ven/brands/${brandId}`, {
        name: form.name,
        domain: form.domain,
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
      })
      addToast({ message: 'Profile updated.', type: 'success' })
      setEditing(false)
      mutate()
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to update profile.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!brand) {
    return <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Your brand profile information.</p>
        {!editing && (
          <button onClick={startEdit}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Domain</label>
            <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categories (comma-separated)</label>
            <input type="text" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={loading}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{brand.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Domain</dt>
              <dd className="font-medium text-gray-900">{brand.domain}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Categories</dt>
              <dd className="font-medium text-gray-900">{brand.categories.join(', ')}</dd>
            </div>
            {brand.logoUrl && (
              <div>
                <dt className="text-gray-500">Logo</dt>
                <dd className="mt-1">
                  <img src={brand.logoUrl} alt={brand.name} className="h-12 rounded-lg object-contain" />
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
