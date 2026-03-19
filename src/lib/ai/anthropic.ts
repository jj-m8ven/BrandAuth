import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AITool, AIMessage } from './types'

const anthropic = new Anthropic()

export const anthropicProvider: AIProvider = {
  async stream({ systemPrompt, messages, tools, onText, onToolUse, executeTool }) {
    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: {
        type: 'object' as const,
        properties: t.parameters.properties,
        required: t.parameters.required,
      },
    }))

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    let conversationMessages = [...anthropicMessages]
    let needsCall = true

    while (needsCall) {
      const stream = anthropic.messages.stream({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: anthropicTools,
        messages: conversationMessages,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          onText(event.delta.text)
        }
      }

      const response = await stream.finalMessage()
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      if (toolUseBlocks.length === 0) {
        needsCall = false
        break
      }

      conversationMessages = [
        ...conversationMessages,
        { role: 'assistant' as const, content: response.content },
      ]

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of toolUseBlocks) {
        onToolUse(block.name)
        const result = await executeTool(block.name, block.input as Record<string, unknown>)
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
  },
}
