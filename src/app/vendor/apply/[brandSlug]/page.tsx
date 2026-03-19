'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiPost } from '@/lib/fetcher'
import { applicationSchema } from '@/lib/schemas'
import { useAppStore } from '@/stores/appStore'
import Link from 'next/link'
import type { Brand, Tier } from '@/types'

export default function ApplyPage() {
  return <ApplyForm authenticated />
}

export function ApplyForm({ authenticated }: { authenticated: boolean }) {
  const params = useParams()
  const router = useRouter()
  const addToast = useAppStore((s) => s.addToast)
  const brandSlug = params.brandSlug as string

  const { data: brand } = useSWR<Brand>(`/api/m8ven/brands/${brandSlug}`, fetcher)
  const { data: tiers } = useSWR<Tier[]>(`/api/m8ven/brands/${brandSlug}/tiers`, fetcher)

  const [form, setForm] = useState({
    tier: '',
    channels: [] as string[],
    skuScope: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const CHANNELS = ['Amazon', 'TikTok Shop', 'eBay', 'Own Website', 'Retail', 'Wholesale']

  const toggleChannel = (ch: string) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
    }))
  }

  const handleSubmit = async () => {
    const result = applicationSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) errs[issue.path[0] as string] = issue.message
      setErrors(errs)
      return
    }
    setErrors({})

    if (!authenticated) {
      // Save form to sessionStorage and redirect to signup
      sessionStorage.setItem('pendingApplication', JSON.stringify({ brandSlug, ...form }))
      router.push('/auth/signup/vendor')
      return
    }

    setLoading(true)
    try {
      await apiPost(`/api/m8ven/brands/${brandSlug}/applications`, {
        tier: form.tier,
        channels: form.channels,
        skuScope: form.skuScope || undefined,
        message: form.message || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Application could not be submitted. Try again.'
      addToast({ message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Application submitted</h1>
          <p className="mt-2 text-sm text-gray-500">
            {brand?.name ?? 'The brand'} will review and respond.
          </p>
          <Link
            href="/vendor"
            className="mt-6 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">BrandGraph</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Brand header */}
        {brand ? (
          <div className="flex items-center gap-4">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-14 w-14 rounded-xl object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-xl font-bold text-violet-600">
                {brand.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{brand.name}</h1>
              <p className="text-sm text-gray-500">{brand.categories.join(', ')}</p>
            </div>
          </div>
        ) : (
          <div className="h-14 w-64 animate-pulse rounded bg-gray-100" />
        )}

        {/* Form */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Apply for authorization</h2>

          <div className="mt-6 space-y-5">
            {/* Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Authorization tier</label>
              {tiers ? (
                <div className="mt-2 space-y-2">
                  {tiers.map((tier) => (
                    <label
                      key={tier.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                        form.tier === tier.name
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={tier.name}
                        checked={form.tier === tier.name}
                        onChange={() => setForm({ ...form, tier: tier.name })}
                        className="mt-0.5 text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tier.name}</p>
                        <p className="text-xs text-gray-500">{tier.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              )}
              {errors.tier && <p className="mt-1 text-xs text-red-600">{errors.tier}</p>}
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channels you intend to sell on
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CHANNELS.map((ch) => (
                  <label key={ch} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.channels.includes(ch)}
                      onChange={() => toggleChannel(ch)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    {ch}
                  </label>
                ))}
              </div>
              {errors.channels && <p className="mt-1 text-xs text-red-600">{errors.channels}</p>}
            </div>

            {/* SKU scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Specific product lines <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Leave blank for all products"
                value={form.skuScope}
                onChange={(e) => setForm({ ...form, skuScope: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message to {brand?.name ?? 'brand'} <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tell them about your business"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : authenticated ? 'Submit application' : 'Create account to submit'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
