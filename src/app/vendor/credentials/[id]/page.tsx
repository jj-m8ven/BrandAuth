'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { AuthorizationBadge } from '@/components/ui/AuthorizationBadge'
import { TierBadge } from '@/components/ui/TierBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import Link from 'next/link'
import type { Authorization } from '@/types'

export default function CredentialPage() {
  const params = useParams()
  const id = params.id as string

  const { data: credential } = useSWR<Authorization>(
    `/api/m8ven/vendors/me/authorizations/${id}`,
    fetcher
  )

  if (!credential) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold text-gray-900">BrandGraph</Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-8">
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        </main>
      </div>
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const verifyUrl = `${appUrl}/verify/${credential.brandId}/${credential.vendorId}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">BrandGraph</Link>
          <Link href="/vendor" className="text-sm font-medium text-violet-600 hover:text-violet-500">
            &larr; Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {credential.brandLogoUrl ? (
              <img src={credential.brandLogoUrl} alt={credential.brandName} className="h-14 w-14 rounded-xl object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-xl font-bold text-violet-600">
                {credential.brandName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{credential.brandName}</h1>
              <div className="mt-1 flex gap-2">
                <AuthorizationBadge status={credential.status} />
                <TierBadge tier={credential.tier} />
              </div>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-gray-500">Channels</dt>
              <dd className="mt-1 font-medium text-gray-900">{credential.channels.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Authorized since</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {new Date(credential.authorizedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </dd>
            </div>
            {credential.expiresAt && (
              <div>
                <dt className="text-gray-500">Expires</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {new Date(credential.expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Shareable verification */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Shareable Verification</h2>
          <p className="mt-1 text-sm text-gray-500">
            Share this link in your email signature, marketplace profiles, or website to prove your authorization.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
              {verifyUrl}
            </code>
            <CopyButton text={verifyUrl} label="Copy" />
          </div>
        </div>
      </main>
    </div>
  )
}
