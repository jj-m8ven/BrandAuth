'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { brandSignupStep1Schema, brandSignupStep2Schema } from '@/lib/schemas'
import { apiPost } from '@/lib/fetcher'
import { useAppStore } from '@/stores/appStore'
import Link from 'next/link'

const CATEGORIES = [
  'Apparel & Fashion',
  'Electronics',
  'Beauty & Personal Care',
  'Home & Garden',
  'Sports & Outdoors',
  'Food & Beverage',
  'Health & Wellness',
  'Toys & Games',
  'Automotive',
  'Jewelry & Watches',
]

type Step1Data = {
  email: string
  password: string
  confirmPassword: string
  brandName: string
  primaryDomain: string
}

type Step2Data = {
  categories: string[]
  marketplaceUrls: string[]
  trademarkNumber: string
}

export default function BrandSignupPage() {
  const router = useRouter()
  const addToast = useAppStore((s) => s.addToast)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pendingReview, setPendingReview] = useState(false)

  const [step1, setStep1] = useState<Step1Data>({
    email: '',
    password: '',
    confirmPassword: '',
    brandName: '',
    primaryDomain: '',
  })
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})

  const [step2, setStep2] = useState<Step2Data>({
    categories: [],
    marketplaceUrls: [''],
    trademarkNumber: '',
  })
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({})

  const [acceptTos, setAcceptTos] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleStep1Next = () => {
    const result = brandSignupStep1Schema.safeParse(step1)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[issue.path[0] as string] = issue.message
      }
      setStep1Errors(errs)
      return
    }
    setStep1Errors({})
    setStep(1)
  }

  const handleStep2Next = () => {
    const urls = step2.marketplaceUrls.filter((u) => u.trim())
    const result = brandSignupStep2Schema.safeParse({
      ...step2,
      marketplaceUrls: urls,
    })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[issue.path[0] as string] = issue.message
      }
      setStep2Errors(errs)
      return
    }
    setStep2Errors({})
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!acceptTos) return
    setLoading(true)
    setSubmitError('')

    try {
      const res = await apiPost<{ id: string; status: string }>('/api/m8ven/brands', {
        name: step1.brandName,
        domain: step1.primaryDomain,
        email: step1.email,
        password: step1.password,
        categories: step2.categories,
        marketplaceUrls: step2.marketplaceUrls.filter((u) => u.trim()),
        trademarkNumber: step2.trademarkNumber || undefined,
      })

      if (res.status === 'pending_review') {
        setPendingReview(true)
      } else {
        router.push(`/dashboard/brands/${res.id}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong on our end. Your progress is saved — try again in a moment.'
      setSubmitError(message)
      addToast({ message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setStep2((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }))
  }

  const addUrlField = () => {
    setStep2((prev) => ({ ...prev, marketplaceUrls: [...prev.marketplaceUrls, ''] }))
  }

  const updateUrl = (index: number, value: string) => {
    setStep2((prev) => ({
      ...prev,
      marketplaceUrls: prev.marketplaceUrls.map((u, i) => (i === index ? value : u)),
    }))
  }

  if (pendingReview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <svg className="h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">We&apos;re verifying your brand</h1>
          <p className="mt-2 text-sm text-gray-500">
            Usually takes under an hour. We&apos;ll email you when you&apos;re ready.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-2xl font-bold text-gray-900">Set up your brand</h1>
        <div className="mt-6">
          <StepIndicator currentStep={step} />
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Step 1: Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={step1.email}
                  onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {step1Errors.email && <p className="mt-1 text-xs text-red-600">{step1Errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={step1.password}
                  onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {step1Errors.password && <p className="mt-1 text-xs text-red-600">{step1Errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  type="password"
                  value={step1.confirmPassword}
                  onChange={(e) => setStep1({ ...step1, confirmPassword: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {step1Errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{step1Errors.confirmPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand name</label>
                <input
                  type="text"
                  value={step1.brandName}
                  onChange={(e) => setStep1({ ...step1, brandName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {step1Errors.brandName && <p className="mt-1 text-xs text-red-600">{step1Errors.brandName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary domain</label>
                <input
                  type="text"
                  placeholder="yourbrand.com"
                  value={step1.primaryDomain}
                  onChange={(e) => setStep1({ ...step1, primaryDomain: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {step1Errors.primaryDomain && <p className="mt-1 text-xs text-red-600">{step1Errors.primaryDomain}</p>}
              </div>
              <button
                onClick={handleStep1Next}
                className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Verification */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product categories</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={step2.categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
                {step2Errors.categories && <p className="mt-1 text-xs text-red-600">{step2Errors.categories}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Marketplace URLs</label>
                <p className="text-xs text-gray-500">Amazon, TikTok Shop, your own site, etc.</p>
                {step2.marketplaceUrls.map((url, i) => (
                  <input
                    key={i}
                    type="url"
                    placeholder="https://"
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                ))}
                <button
                  type="button"
                  onClick={addUrlField}
                  className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-500"
                >
                  + Add another URL
                </button>
                {step2Errors.marketplaceUrls && <p className="mt-1 text-xs text-red-600">{step2Errors.marketplaceUrls}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trademark number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={step2.trademarkNumber}
                  onChange={(e) => setStep2({ ...step2, trademarkNumber: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Next}
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <h3 className="font-medium text-gray-900">Account</h3>
                <p className="text-gray-600">{step1.email}</p>
                <p className="text-gray-600">{step1.brandName} &mdash; {step1.primaryDomain}</p>

                <h3 className="mt-4 font-medium text-gray-900">Verification</h3>
                <p className="text-gray-600">Categories: {step2.categories.join(', ')}</p>
                <p className="text-gray-600">
                  URLs: {step2.marketplaceUrls.filter((u) => u.trim()).join(', ')}
                </p>
                {step2.trademarkNumber && (
                  <p className="text-gray-600">Trademark: {step2.trademarkNumber}</p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={acceptTos}
                  onChange={(e) => setAcceptTos(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                I accept the Terms of Service and Privacy Policy
              </label>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!acceptTos || loading}
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? 'Creating brand...' : 'Create brand'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-violet-600 hover:text-violet-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
