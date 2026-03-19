import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth as unknown as { role?: string; brandId?: string } | null

  // Protected brand routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    if (session.role === 'vendor') {
      return NextResponse.redirect(new URL('/vendor', req.url))
    }
  }

  // Protected vendor routes
  if (pathname.startsWith('/vendor')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    if (session.role === 'brand') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protected assistant route
  if (pathname.startsWith('/assistant')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/vendor/:path*', '/assistant/:path*'],
}
