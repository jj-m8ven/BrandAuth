import type { ApiError } from '@/types'

export class FetchError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/auth/login?reason=session_expired'
      throw new FetchError('Session expired', 401, 'UNAUTHORIZED')
    }

    const error: ApiError = await res.json().catch(() => ({
      error: 'Something went wrong. Try again.',
      code: 'UNKNOWN',
    }))

    throw new FetchError(error.error, res.status, error.code)
  }

  return res.json()
}

export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/auth/login?reason=session_expired'
      throw new FetchError('Session expired', 401, 'UNAUTHORIZED')
    }

    const error: ApiError = await res.json().catch(() => ({
      error: 'Something went wrong. Try again.',
      code: 'UNKNOWN',
    }))

    throw new FetchError(error.error, res.status, error.code)
  }

  return res.json()
}

export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/auth/login?reason=session_expired'
      throw new FetchError('Session expired', 401, 'UNAUTHORIZED')
    }

    const error: ApiError = await res.json().catch(() => ({
      error: 'Something went wrong. Try again.',
      code: 'UNKNOWN',
    }))

    throw new FetchError(error.error, res.status, error.code)
  }

  return res.json()
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/auth/login?reason=session_expired'
      throw new FetchError('Session expired', 401, 'UNAUTHORIZED')
    }

    const error: ApiError = await res.json().catch(() => ({
      error: 'Something went wrong. Try again.',
      code: 'UNKNOWN',
    }))

    throw new FetchError(error.error, res.status, error.code)
  }

  return res.json()
}
