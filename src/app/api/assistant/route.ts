import { auth } from '@/lib/auth'
import { getAIProvider } from '@/lib/ai'
import type { AITool } from '@/lib/ai'
import { NextRequest } from 'next/server'

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

const tools: AITool[] = [
  {
    name: 'check_brand_authorization',
    description: 'Check if a specific seller/distributor is authorized by a brand. Accepts seller_name, seller_id, or business_tax_id. Returns authorization status, tier, and platforms.',
    parameters: {
      type: 'object',
      properties: {
        seller_name: { type: 'string', description: 'The seller/distributor name to check' },
        seller_id: { type: 'string', description: 'The seller ID to check' },
        business_tax_id: { type: 'string', description: 'The business tax ID to check' },
      },
      required: [],
    },
  },
  {
    name: 'get_brand_vendors',
    description: 'Get a list of active authorized distributors for a brand.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status', enum: ['active', 'pending', 'revoked', 'suspended'] },
        limit: { type: 'number', description: 'Max results to return (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'get_brand_applications',
    description: 'Get pending applications for a brand. Only available to brand users. Note: this endpoint is not yet confirmed.',
    parameters: {
      type: 'object',
      properties: {
        brand_id: { type: 'string', description: 'The brand ID' },
        status: { type: 'string', description: 'Filter by status', enum: ['pending', 'approved', 'denied'] },
      },
      required: ['brand_id'],
    },
  },
  {
    name: 'get_brand_stats',
    description: 'Get usage statistics for the current billing period: auth check count, response times, and daily breakdown.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'The period to query (default: current_month)', enum: ['current_month'] },
      },
      required: [],
    },
  },
]

interface CallM8venApiOptions {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
}

async function callM8venApi(path: string, userId: string, options: CallM8venApiOptions = {}): Promise<unknown> {
  const { method = 'GET', body } = options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${M8VEN_API_KEY}`,
      'X-User-Id': userId,
      'Content-Type': 'application/json',
    },
  }
  if (body && method === 'POST') {
    fetchOptions.body = JSON.stringify(body)
  }
  const res = await fetch(`${M8VEN_API_URL}/${path}`, fetchOptions)
  return res.json()
}

async function executeTool(name: string, args: Record<string, unknown>, userId: string): Promise<string> {
  try {
    let result: unknown

    switch (name) {
      case 'check_brand_authorization': {
        const body: Record<string, unknown> = {}
        if (args.seller_name) body.seller_name = args.seller_name
        if (args.seller_id) body.seller_id = args.seller_id
        if (args.business_tax_id) body.business_tax_id = args.business_tax_id
        result = await callM8venApi(
          'api/v1/brand-auth/check',
          userId,
          { method: 'POST', body }
        )
        break
      }
      case 'get_brand_vendors': {
        const status = (args.status as string) || 'active'
        const limit = (args.limit as number) || 20
        result = await callM8venApi(
          `api/v1/brand-auth/distributors?status=${status}&limit=${limit}`,
          userId
        )
        break
      }
      case 'get_brand_applications':
        result = await callM8venApi(
          `api/v1/brand-auth/distributors?brand_id=${args.brand_id}&status=${args.status || 'pending'}`,
          userId
        )
        break
      case 'get_brand_stats': {
        const period = (args.period as string) || 'current_month'
        result = await callM8venApi(
          `api/v1/usage?period=${period}`,
          userId
        )
        break
      }
      default:
        return JSON.stringify({ error: 'Unknown tool' })
    }

    return JSON.stringify(result)
  } catch {
    return JSON.stringify({ error: 'Failed to fetch data from M8ven API' })
  }
}

function buildSystemPrompt(session: { role: string; brandId?: string; passportId?: string }): string {
  let prompt = `You are BrandGraph Assistant. You help brands and vendors manage product authorization. The current user is a ${session.role}.`

  if (session.role === 'brand' && session.brandId) {
    prompt += ` You are managing brand ID: ${session.brandId}.`
  }
  if (session.role === 'vendor' && session.passportId) {
    prompt += ` Your M8ven passport ID is ${session.passportId}.`
  }

  prompt += `

Answer questions about their authorization graph. Use tools to fetch live data — do not make up authorization status. Keep responses concise and action-oriented.

When presenting data:
- Format numbers and dates clearly
- Use bullet points for lists
- Highlight important status changes
- Suggest next actions when appropriate`

  return prompt
}

export async function POST(req: NextRequest) {
  const session = await auth() as unknown as {
    userId: string
    role: string
    brandId?: string
    passportId?: string
  } | null

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
  }

  const systemPrompt = buildSystemPrompt(session)
  const provider = getAIProvider()
  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

        await provider.stream({
          systemPrompt,
          messages,
          tools,
          onText: (text) => send({ type: 'text', text }),
          onToolUse: (name) => send({ type: 'tool_use', name }),
          executeTool: (name, args) => executeTool(name, args, session.userId),
        })

        send({ type: 'done' })
        controller.close()
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Something went wrong. Try again.' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
