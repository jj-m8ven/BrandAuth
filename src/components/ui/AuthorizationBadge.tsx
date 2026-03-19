import type { AuthorizationStatus } from '@/types'

const statusStyles: Record<AuthorizationStatus, string> = {
  active: 'bg-violet-100 text-violet-700',
  pending: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-700',
  suspended: 'bg-orange-100 text-orange-700',
  expired: 'bg-gray-100 text-gray-500',
}

const dotStyles: Record<AuthorizationStatus, string> = {
  active: 'bg-violet-500',
  pending: 'bg-amber-500',
  revoked: 'bg-red-500',
  suspended: 'bg-orange-500',
  expired: 'bg-gray-400',
}

const labels: Record<AuthorizationStatus, string> = {
  active: 'Authorized',
  pending: 'Pending',
  revoked: 'Revoked',
  suspended: 'Suspended',
  expired: 'Expired',
}

export function AuthorizationBadge({ status }: { status: AuthorizationStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  )
}
