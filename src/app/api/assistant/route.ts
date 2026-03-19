import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

const M8VEN_API_URL = process.env.NEXT_PUBLIC_M8VEN_API_URL!
const M8VEN_API_KEY = process.env.M8VEN_API_KEY!

const tools: Anthropic.Tool[] = [
  {
    name: 'check_brand_authorization',
    description: 'Check if a specific vendor is authorized by a specific brand. Returns authorization status, tier, and channels.',
    input_schema: {
      type: 'object' as const,
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
    input_schema: {
      type: 'object' as const,
      properties: {
        brand_id: { type: 'string', description: 'The brand ID' },
        status: { type: 'string', description: 'Filter by status: authorized, pending, revoked, suspended', enum: ['authorized', 'pending', 'revoked', 'suspended'] },
        limit: { type: 'number', description: 'Max results to return (default 20)' },
      },
      required: ['brand_id'],
    },
  },
  {
    name: 'get_vendor_credentials',
    description: 'Get all brand authorization credentials for a vendor.',
    input_schema: {
      type: 'object' as const,
      properties: {
        passport_id: { type: 'string', description: 'The vendor passport ID' },
      },
      required: ['passport_id'],
    },
  },
  {
    name: 'get_brand_applications',
    description: 'Get pending applications for a brand. Only available to brand users.',
    input_schema: {
      type: 'object' as const,
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
    input_schema: {
      type: 'object' as const,
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

async function executeTool(name: string, input: Record<string, unknown>, userId: string): Promise<string> {
  try {
    let result: unknown

    switch (name) {
      case 'check_brand_authorization':
        result = await callM8venApi(
          `v1/brand-auth/check?brandId=${input.brand_id}&vendorId=${input.vendor_id}`,
          userId
        )
        break
      case 'get_brand_vendors':
        result = await callM8venApi(
          `brands/${input.brand_id}/distributors?limit=${input.limit || 20}${input.status ? `&status=${input.status}` : ''}`,
          userId
        )
        break
      case 'get_vendor_credentials':
        result = await callM8venApi(
          `vendors/${input.passport_id}/authorizations`,
          userId
        )
        break
      case 'get_brand_applications':
        result = await callM8venApi(
          `brands/${input.brand_id}/applications?status=${input.status || 'pending'}`,
          userId
        )
        break
      case 'get_brand_stats':
        result = await callM8venApi(
          `brands/${input.brand_id}/stats`,
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

function buildSystemPrompt(session: { role: string; brandId?: string; passportId?: string; userId: string }): string {
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
    messages: Anthropic.MessageParam[]
  }

  const systemPrompt = buildSystemPrompt(session)

  // Stream the response
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
  })

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

        let conversationMessages = [...messages]
        let needsCall = true

        while (needsCall) {
          const currentStream = conversationMessages === messages
            ? stream
            : anthropic.messages.stream({
                model: 'claude-sonnet-4-6-20250514',
                max_tokens: 4096,
                system: systemPrompt,
                tools,
                messages: conversationMessages,
              })

          // Stream text deltas as they arrive
          for await (const event of currentStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ type: 'text', text: event.delta.text })
            }
          }

          const response = await currentStream.finalMessage()

          // Check if there are tool calls to process
          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
          )

          if (toolUseBlocks.length === 0) {
            needsCall = false
            break
          }

          // Process tool calls
          conversationMessages = [
            ...conversationMessages,
            { role: 'assistant' as const, content: response.content },
          ]

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of toolUseBlocks) {
            send({ type: 'tool_use', name: block.name })
            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>,
              session.userId
            )
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            })
          }

          conversationMessages = [
            ...conversationMessages,
            { role: 'user' as const, content: toolResults },
          ]
        }

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
