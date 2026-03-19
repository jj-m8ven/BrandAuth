import { auth } from '@/lib/auth'
import { getAIProvider } from '@/lib/ai'
import type { AITool } from '@/lib/ai'
import { NextRequest } from 'next/server'

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

const tools: AITool[] = [
  {
    name: 'check_brand_authorization',
    description: 'Check if a specific vendor is authorized by a specific brand. Returns authorization status, tier, and channels.',
    parameters: {
      type: 'object',
      properties: {
        brand_id: { type: 'string', description: 'The brand ID or slug' },
        vendor_id: { type: 'string', description: 'The vendor ID or passport ID' },
      },
      required: ['brand_id', 'vendor_id'],
    },
  },
  {
    name: 'get_brand_vendors',
    description: 'Get a list of vendors authorized by a brand. Can filter by status.',
    parameters: {
      type: 'object',
      properties: {
        brand_id: { type: 'string', description: 'The brand ID' },
        status: { type: 'string', description: 'Filter by status', enum: ['authorized', 'pending', 'revoked', 'suspended'] },
        limit: { type: 'number', description: 'Max results to return (default 20)' },
      },
      required: ['brand_id'],
    },
  },
  {
    name: 'get_vendor_credentials',
    description: 'Get all brand authorization credentials for a vendor.',
    parameters: {
      type: 'object',
      properties: {
        passport_id: { type: 'string', description: 'The vendor passport ID' },
      },
      required: ['passport_id'],
    },
  },
  {
    name: 'get_brand_applications',
    description: 'Get pending applications for a brand. Only available to brand users.',
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
    description: 'Get dashboard statistics for a brand: total vendors, pending applications, active API keys, credentials issued this month.',
    parameters: {
      type: 'object',
      properties: {
        brand_id: { type: 'string', description: 'The brand ID' },
      },
      required: ['brand_id'],
    },
  },
]

async function callM8venApi(path: string, userId: string): Promise<unknown> {
  const res = await fetch(`${M8VEN_API_URL}/${path}`, {
    headers: {
      'Authorization': `Bearer ${M8VEN_API_KEY}`,
      'X-User-Id': userId,
    },
  })
  return res.json()
}

async function executeTool(name: string, args: Record<string, unknown>, userId: string): Promise<string> {
  try {
    let result: unknown

    switch (name) {
      case 'check_brand_authorization':
        result = await callM8venApi(
          `v1/brand-auth/check?brandId=${args.brand_id}&vendorId=${args.vendor_id}`,
          userId
        )
        break
      case 'get_brand_vendors':
        result = await callM8venApi(
          `brands/${args.brand_id}/distributors?limit=${args.limit || 20}${args.status ? `&status=${args.status}` : ''}`,
          userId
        )
        break
      case 'get_vendor_credentials':
        result = await callM8venApi(
          `vendors/${args.passport_id}/authorizations`,
          userId
        )
        break
      case 'get_brand_applications':
        result = await callM8venApi(
          `brands/${args.brand_id}/applications?status=${args.status || 'pending'}`,
          userId
        )
        break
      case 'get_brand_stats':
        result = await callM8venApi(
          `brands/${args.brand_id}/stats`,
          userId
        )
        break
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
