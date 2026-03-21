'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import type { ReactNode } from 'react'

const navItems = [
  { label: 'Overview', href: '' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Applications', href: '/applications' },
  { label: 'Settings', href: '/settings' },
]

export default function BrandDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const brandId = params.id as string
  const base = `/dashboard/brands/${brandId}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Mercavi
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const href = `${base}${item.href}`
              const isActive =
                item.href === ''
                  ? pathname === base
                  : pathname.startsWith(href)

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
