'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface StreamEvent {
  type: 'text' | 'tool_use' | 'done' | 'error'
  text?: string
  name?: string
  error?: string
}

const BRAND_PROMPTS = [
  'How many vendors do I have authorized?',
  'Show me pending applications',
  'Which vendors were recently revoked?',
  'What are my dashboard stats?',
]

const VENDOR_PROMPTS = [
  'What brands am I authorized with?',
  'Is my authorization with [brand] still active?',
  'Show me all my credentials',
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toolStatus, setToolStatus] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, toolStatus])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = { role: 'user', content: messageText }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setToolStatus(null)

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/auth/login?reason=session_expired'
          return
        }
        throw new Error('Failed to get response')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const json = line.slice(6)
          try {
            const event: StreamEvent = JSON.parse(json)

            if (event.type === 'text' && event.text) {
              assistantText += event.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantText,
                }
                return updated
              })
              setToolStatus(null)
            } else if (event.type === 'tool_use' && event.name) {
              setToolStatus(`Looking up ${event.name.replace(/_/g, ' ')}...`)
            } else if (event.type === 'error') {
              assistantText = event.error || 'Something went wrong. Try again.'
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantText,
                }
                return updated
              })
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong. Try again.' },
      ])
    } finally {
      setLoading(false)
      setToolStatus(null)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Minimal header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <Link href="/" className="text-lg font-bold text-gray-900">
          Mercavi
        </Link>
        <span className="text-sm font-medium text-violet-600">Assistant</span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
              <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Mercavi Assistant</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ask me anything about your authorization network.
            </p>

            <div className="mt-8 grid w-full max-w-lg gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Try asking
              </p>
              {[...BRAND_PROMPTS.slice(0, 2), ...VENDOR_PROMPTS.slice(0, 1)].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-left text-sm text-gray-700 transition hover:border-violet-300 hover:bg-violet-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-6 ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {toolStatus && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {toolStatus}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your authorization network..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-violet-600 p-3 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
