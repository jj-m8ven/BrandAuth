import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { path } = await params
  const apiPath = path.join('/')
  const url = new URL(`${M8VEN_API_URL}/${apiPath}`)

  // Forward query params
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${M8VEN_API_KEY}`,
    'X-User-Id': (session as unknown as { userId: string }).userId,
  }

  // Forward body for non-GET requests
  let body: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text()
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
    })

    // Handle rate limiting
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      return NextResponse.json(
        { error: 'Rate limited. Please try again later.', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: retryAfter ? { 'Retry-After': retryAfter } : undefined,
        }
      )
    }

    // Handle server errors
    if (res.status >= 500) {
      return NextResponse.json(
        { error: 'Something went wrong. Try again.', code: 'UPSTREAM_ERROR' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach M8ven API.', code: 'NETWORK_ERROR' },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PATCH = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
