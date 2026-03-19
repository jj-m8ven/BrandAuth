import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardRedirect() {
  const session = await auth() as unknown as { brandId?: string } | null

  if (!session) {
    redirect('/auth/login')
  }

  if (session.brandId) {
    redirect(`/dashboard/brands/${session.brandId}`)
  }

  redirect('/auth/login')
}
