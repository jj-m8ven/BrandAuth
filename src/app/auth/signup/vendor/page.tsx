'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { vendorSignupSchema, type VendorSignupInput } from '@/lib/schemas'
import { apiPost } from '@/lib/fetcher'
import { useAppStore } from '@/stores/appStore'
import Link from 'next/link'

export default function VendorSignupPage() {
  const router = useRouter()
  const addToast = useAppStore((s) => s.addToast)
  const [form, setForm] = useState<VendorSignupInput>({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    passportId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = vendorSignupSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[issue.path[0] as string] = issue.message
      }
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await apiPost('/api/m8ven/vendors', {
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        passportId: form.passportId || undefined,
      })
      router.push('/vendor')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.'
      addToast({ message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-gray-900">Create your vendor account</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Get authorized credentials from the brands you sell
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Business name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.businessName && <p className="mt-1 text-xs text-red-600">{errors.businessName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              M8ven Passport ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Link your existing M8ven passport"
              value={form.passportId}
              onChange={(e) => setForm({ ...form, passportId: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

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
