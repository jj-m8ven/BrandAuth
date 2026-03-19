import OpenAI from 'openai'
import type { AIProvider, AITool, AIMessage } from './types'

const openai = new OpenAI()

export const openaiProvider: AIProvider = {
  async stream({ systemPrompt, messages, tools, onText, onToolUse, executeTool }) {
    const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    let needsCall = true

    while (needsCall) {
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        max_tokens: 4096,
        tools: openaiTools,
        messages: openaiMessages,
        stream: true,
      })

      const currentToolCalls = new Map<number, { id: string; name: string; arguments: string }>()
      let assistantContent = ''

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta

        if (delta?.content) {
          assistantContent += delta.content
          onText(delta.content)
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = currentToolCalls.get(tc.index)
            if (existing) {
              if (tc.function?.arguments) existing.arguments += tc.function.arguments
            } else {
              currentToolCalls.set(tc.index, {
                id: tc.id || '',
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || '',
              })
            }
          }
        }
      }

      if (currentToolCalls.size === 0) {
        needsCall = false
        break
      }

      const toolCallsArray = Array.from(currentToolCalls.values())
      openaiMessages.push({
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: toolCallsArray.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      })

      for (const tc of toolCallsArray) {
        onToolUse(tc.name)
        let args: Record<string, unknown> = {}
        try { args = JSON.parse(tc.arguments) } catch { /* empty */ }
        const result = await executeTool(tc.name, args)
        openaiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        })
      }
    }
  },
}
