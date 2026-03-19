import type { Metadata } from 'next'
import { CopyButton } from '@/components/ui/CopyButton'
import { TierBadge } from '@/components/ui/TierBadge'
import { Footer } from '@/components/Footer'
import type { Authorization } from '@/types'

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

interface VerificationData extends Partial<Authorization> {
  error?: string
  not_found?: boolean
}

async function getVerification(brandSlug: string, vendorId: string): Promise<VerificationData> {
  try {
    const res = await fetch(`${M8VEN_API_URL}/api/v1/brand-auth/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${M8VEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seller_name: vendorId,
      }),
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return { not_found: true }
      }
      return { error: 'Authorization status could not be verified right now. Try again shortly.' }
    }

    return await res.json()
  } catch {
    return { error: 'Authorization status could not be verified right now. Try again shortly.' }
  }
}

type PageProps = {
  params: Promise<{ brandSlug: string; vendorId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug, vendorId } = await params
  const data = await getVerification(brandSlug, vendorId)

  if (data.not_found || data.error || !data.brand_name) {
    return {
      title: 'Verification — BrandGraph',
      description: 'Check distributor authorization status.',
    }
  }

  return {
    title: `${data.distributor_id} is ${data.authorized ? 'authorized by' : 'not authorized by'} ${data.brand_name}`,
    description: `Verify distributor authorization status with ${data.brand_name} on BrandGraph.`,
    openGraph: {
      title: `${data.distributor_id} is ${data.authorized ? 'authorized by' : 'not authorized by'} ${data.brand_name}`,
      description: `Real-time distributor authorization verification powered by BrandGraph.`,
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
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{data.error}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Not found
  if (data.not_found || !data.brand_name) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center bg-gray-50 px-4">
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
        <Footer />
      </div>
    )
  }

  const isAuthorized = data.authorized === true
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

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {/* Status indicator */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          {isAuthorized ? (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-[32px] font-bold text-green-700">Authorized</h1>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-[32px] font-bold text-red-700">Not Authorized</h1>
            </>
          )}
        </div>

        {/* Details */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Brand</p>
            <div className="mt-3">
              <span className="text-lg font-semibold text-gray-900">{data.brand_name}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Distributor</p>
            <div className="mt-3">
              <span className="text-lg font-semibold text-gray-900">{data.distributor_id}</span>
              {data.passport_url && (
                <div className="mt-2">
                  <a href={data.passport_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium text-violet-600 hover:text-violet-500">
                    View M8ven passport &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Authorization details */}
        {isAuthorized && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Authorization Details</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Tier</p>
                <div className="mt-1">
                  <TierBadge tier={data.authorization_tier ?? ''} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Platforms</p>
                <p className="mt-1 text-sm font-medium capitalize text-gray-900">
                  {data.platforms?.join(', ').replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">SKU Scope</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {data.sku_scope ?? 'All products'}
                </p>
              </div>
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

      <Footer />
    </div>
  )
}
