export interface AITool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'done' | 'error'
  text?: string
  name?: string
  error?: string
}

export interface AIProvider {
  stream(options: {
    systemPrompt: string
    messages: AIMessage[]
    tools: AITool[]
    onText: (text: string) => void
    onToolUse: (name: string) => void
    executeTool: (name: string, args: Record<string, unknown>) => Promise<string>
  }): Promise<void>
}
