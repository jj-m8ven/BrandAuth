'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginSchema, type LoginInput } from '@/lib/schemas'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState<LoginInput>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  const reason = searchParams.get('reason')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')

    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginInput
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.error) {
      setGeneralError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-gray-900">Sign in to Mercavi</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Manage your brand authorization network
        </p>

        {reason === 'session_expired' && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            Your session has expired. Please sign in again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {generalError && (
            <p className="text-sm text-red-600">{generalError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-violet-600 hover:text-violet-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
