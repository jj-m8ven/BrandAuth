import type { AIProvider } from './types'

export type { AIProvider, AITool, AIMessage, StreamEvent } from './types'

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai'

  switch (provider) {
    case 'anthropic': {
      // Dynamic import to avoid loading unused SDK
      const { anthropicProvider } = require('./anthropic')
      return anthropicProvider
    }
    case 'openai':
    default: {
      const { openaiProvider } = require('./openai')
      return openaiProvider
    }
  }
}
