'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CopyButton } from '@/components/ui/CopyButton'
import Link from 'next/link'
import type { BrandStats, ActivityEvent } from '@/types'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

const actionLabels: Record<string, { text: string; color: string }> = {
  granted: { text: 'Authorized', color: 'bg-green-100 text-green-700' },
  revoked: { text: 'Revoked', color: 'bg-red-100 text-red-700' },
  applied: { text: 'Applied', color: 'bg-blue-100 text-blue-700' },
  suspended: { text: 'Suspended', color: 'bg-orange-100 text-orange-700' },
}

export default function BrandDashboard() {
  const params = useParams()
  const brandId = params.id as string

  const { data: stats, error: statsError } = useSWR<BrandStats>(
    `/api/m8ven/api/v1/usage?period=current_month`,
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: activity } = useSWR<ActivityEvent[]>(
    `/api/m8ven/api/v1/brand-auth/distributors?status=active&limit=10`,
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: pendingData } = useSWR<{ count: number }>(
    `/api/m8ven/api/v1/brand-auth/distributors?status=pending&limit=1`,
    fetcher,
    { refreshInterval: 60000 }
  )

  const pendingCount = pendingData?.count ?? 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div>
      {/* Alert banner */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            You have <span className="font-semibold">{pendingCount}</span> application{pendingCount !== 1 ? 's' : ''} waiting for review.{' '}
            <Link
              href={`/dashboard/brands/${brandId}/applications`}
              className="font-medium underline hover:text-amber-900"
            >
              Review now
            </Link>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Distributors"
          value={statsError ? '--' : (stats?.totalDistributors ?? '--')}
        />
        <StatCard
          label="Pending Applications"
          value={statsError ? '--' : (stats?.pendingApplications ?? '--')}
        />
        <StatCard
          label="Active API Keys"
          value={statsError ? '--' : (stats?.activeApiKeys ?? '--')}
        />
        <StatCard
          label="Auth Checks This Month"
          value={statsError ? '--' : (stats?.checksThisMonth ?? '--')}
        />
      </div>

      {statsError && (
        <p className="mt-2 text-xs text-red-500">
          Could not load stats.{' '}
          <button onClick={() => window.location.reload()} className="underline">
            Retry
          </button>
        </p>
      )}

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/brands/${brandId}/vendors`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View all distributors
        </Link>
        <Link
          href={`/dashboard/brands/${brandId}/settings`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy API key
        </Link>
        <CopyButton
          text={`${appUrl}/brands/${brandId}/apply`}
          label="Copy application link"
        />
      </div>

      {/* Activity feed */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>

        {activity && Array.isArray(activity) && activity.length > 0 ? (
          <div className="mt-4 space-y-3">
            {activity.map((event) => {
              const badge = actionLabels[event.action] ?? {
                text: event.action,
                color: 'bg-gray-100 text-gray-700',
              }
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                    <span className="text-sm text-gray-900">{event.distributor_name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        ) : activity && Array.isArray(activity) && activity.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-gray-900">No activity yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Share your application link to start building your authorized network.
            </p>
            <div className="mt-4">
              <CopyButton
                text={`${appUrl}/brands/${brandId}/apply`}
                label="Copy application link"
              />
            </div>
          </div>
        ) : (
          /* Skeleton */
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
