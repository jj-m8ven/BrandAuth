import type { Metadata } from 'next'
import { CopyButton } from '@/components/ui/CopyButton'
import { AuthorizationBadge } from '@/components/ui/AuthorizationBadge'
import { TierBadge } from '@/components/ui/TierBadge'
import { M8venPassportBadge } from '@/components/ui/M8venPassportBadge'
import type { AuthorizationStatus } from '@/types'

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

interface VerificationData {
  status: AuthorizationStatus | 'not_found'
  brand?: {
    name: string
    slug: string
    logoUrl?: string
  }
  vendor?: {
    name: string
    passportId?: string
    passportScore?: number
  }
  authorization?: {
    tier: string
    channels: string[]
    authorizedAt: string
    expiresAt?: string
  }
  badgeUrl?: string
  error?: string
}

async function getVerification(brandSlug: string, vendorId: string): Promise<VerificationData> {
  try {
    const res = await fetch(
      `${M8VEN_API_URL}/v1/brand-auth/check?brandSlug=${encodeURIComponent(brandSlug)}&vendorId=${encodeURIComponent(vendorId)}`,
      {
        headers: { 'Authorization': `Bearer ${M8VEN_API_KEY}` },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) {
      if (res.status === 404) {
        return { status: 'not_found' }
      }
      return { status: 'not_found', error: 'Authorization status could not be verified right now. Try again shortly.' }
    }

    return await res.json()
  } catch {
    return { status: 'not_found', error: 'Authorization status could not be verified right now. Try again shortly.' }
  }
}

type PageProps = {
  params: Promise<{ brandSlug: string; vendorId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug, vendorId } = await params
  const data = await getVerification(brandSlug, vendorId)

  if (data.status === 'not_found' || !data.brand || !data.vendor) {
    return {
      title: 'Verification — BrandGraph',
      description: 'Check vendor authorization status.',
    }
  }

  const isAuthorized = data.status === 'authorized'
  return {
    title: `${data.vendor.name} ${isAuthorized ? 'is authorized by' : 'is not authorized by'} ${data.brand.name}`,
    description: `Verify ${data.vendor.name}'s authorization status with ${data.brand.name} on BrandGraph.`,
    openGraph: {
      title: `${data.vendor.name} ${isAuthorized ? 'is authorized by' : 'is not authorized by'} ${data.brand.name}`,
      description: `Real-time vendor authorization verification powered by BrandGraph.`,
    },
  }
}

export default async function PublicVerifyPage({ params }: PageProps) {
  const { brandSlug, vendorId } = await params
  const data = await getVerification(brandSlug, vendorId)
  const now = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  // Error state
  if (data.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{data.error}</p>
        </div>
      </div>
    )
  }

  // Not found
  if (data.status === 'not_found' || !data.brand || !data.vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid verification link</h1>
          <p className="mt-1 text-sm text-gray-500">This verification link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const isAuthorized = data.status === 'authorized'
  const isPending = data.status === 'pending'
  const isRevoked = data.status === 'revoked'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandgraph.app'
  const verifyUrl = `${appUrl}/verify/${brandSlug}/${vendorId}`

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-gray-900">BrandGraph</span>
          <span className="text-xs text-gray-400">Verification</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        {/* Status indicator */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          {isAuthorized && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-[32px] font-bold text-green-700">Authorized</h1>
            </>
          )}
          {isPending && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-[32px] font-bold text-amber-700">Pending</h1>
            </>
          )}
          {(isRevoked || data.status === 'suspended' || data.status === 'expired') && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-[32px] font-bold text-red-700">Not Authorized</h1>
              {isRevoked && (
                <p className="mt-1 text-sm text-red-500">This vendor&apos;s authorization was revoked.</p>
              )}
            </>
          )}
        </div>

        {/* Brand & Vendor info */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Brand */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Brand</p>
            <div className="mt-3 flex items-center gap-3">
              {data.brand.logoUrl ? (
                <img
                  src={data.brand.logoUrl}
                  alt={data.brand.name}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-600">
                  {data.brand.name.charAt(0)}
                </div>
              )}
              <span className="text-lg font-semibold text-gray-900">{data.brand.name}</span>
            </div>
          </div>

          {/* Vendor */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Vendor</p>
            <div className="mt-3">
              <span className="text-lg font-semibold text-gray-900">{data.vendor.name}</span>
              <div className="mt-2 flex items-center gap-2">
                {data.vendor.passportScore != null && (
                  <M8venPassportBadge score={data.vendor.passportScore} />
                )}
                {data.vendor.passportId && (
                  <span className="text-xs text-gray-400">ID: {data.vendor.passportId}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Authorization details */}
        {isAuthorized && data.authorization && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Authorization Details</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Tier</p>
                <div className="mt-1">
                  <TierBadge tier={data.authorization.tier} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-1">
                  <AuthorizationBadge status={data.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Channels</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {data.authorization.channels.join(', ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Authorized since</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {new Date(data.authorization.authorizedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
              </div>
              {data.authorization.expiresAt && (
                <div>
                  <p className="text-xs text-gray-500">Expires</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(data.authorization.expiresAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Embeddable badge */}
        {isAuthorized && data.badgeUrl && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Embeddable Badge</p>
            <div className="mt-4 flex items-center gap-4">
              <img src={data.badgeUrl} alt="Authorization badge" className="h-12" />
              <CopyButton
                text={`<a href="${verifyUrl}"><img src="${data.badgeUrl}" alt="Authorized by ${data.brand.name}" /></a>`}
                label="Copy embed code"
              />
            </div>
          </div>
        )}

        {/* Verified timestamp */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Verified in real time at {now}
        </p>

        {/* Share link */}
        <div className="mt-4 flex justify-center">
          <CopyButton text={verifyUrl} label="Copy verification link" />
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        BrandGraph &mdash; powered by M8ven
      </footer>
    </div>
  )
}
