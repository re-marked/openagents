'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DiscordMessageList, type DiscordMessage } from './discord-message-list'
import { DiscordChatInput } from './discord-chat-input'
import { Skeleton } from '@/components/ui/skeleton'

export function DiscordChatPanel({ agentInstanceId }: { agentInstanceId: string }) {
  const [messages, setMessages] = useState<DiscordMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)

  // Queue for non-blocking sends
  const queueRef = useRef<string[]>([])
  const processingRef = useRef(false)

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/history?agentInstanceId=${agentInstanceId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(
            data.messages.map((m: { id: string; role: string; content: string; created_at?: string }) => ({
              id: m.id,
              role: m.role === 'assistant' ? 'master' : 'user',
              content: m.content,
              timestamp: m.created_at ? new Date(m.created_at) : new Date(),
            })),
          )
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [agentInstanceId])

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return

    processingRef.current = true
    setIsTyping(true)

    const message = queueRef.current.shift()!

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId, message }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'master',
            content: `Something went wrong: ${err.error ?? 'Connection failed'}`,
            timestamp: new Date(),
          },
        ])
        processingRef.current = false
        setIsTyping(queueRef.current.length > 0)
        if (queueRef.current.length > 0) processQueue()
        return
      }

      // Read SSE — buffer deltas, only show on "done"
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let currentEvent = ''
      let contentBuffer = ''
      let turnCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
            continue
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim())

              if (currentEvent === 'delta' && data.content !== undefined) {
                contentBuffer += data.content
              } else if (currentEvent === 'done') {
                // A turn is complete — show the whole message at once
                const fullContent = contentBuffer || data.content || ''
                if (fullContent) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `master-${Date.now()}-${turnCount}`,
                      role: 'master',
                      content: fullContent,
                      timestamp: new Date(),
                    },
                  ])
                }
                contentBuffer = ''
                turnCount++
              } else if (currentEvent === 'end') {
                // Entire run finished
                break
              } else if (currentEvent === 'error' || data.error) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `error-${Date.now()}`,
                    role: 'master',
                    content: `Something went wrong: ${data.error ?? 'Unknown error'}`,
                    timestamp: new Date(),
                  },
                ])
                break
              }
            } catch {
              // Not valid JSON, skip
            }
            currentEvent = ''
          }
        }
      }

      // If there's remaining buffered content (stream ended without done event)
      if (contentBuffer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `master-${Date.now()}-final`,
            role: 'master',
            content: contentBuffer,
            timestamp: new Date(),
          },
        ])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'master',
          content: 'Connection failed. Please try again.',
          timestamp: new Date(),
        },
      ])
    }

    processingRef.current = false

    // Process next in queue, or clear typing indicator
    if (queueRef.current.length > 0) {
      processQueue()
    } else {
      setIsTyping(false)
    }
  }, [agentInstanceId])

  const handleSend = useCallback(
    (text: string) => {
      // Add user message immediately
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'user',
          content: text,
          timestamp: new Date(),
        },
      ])

      // Queue and process
      queueRef.current.push(text)
      processQueue()
    },
    [processQueue],
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DiscordMessageList messages={messages} />

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-1">
          <span className="text-muted-foreground text-xs">
            <span className="inline-flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="bg-muted-foreground/60 h-1 w-1 animate-bounce rounded-full [animation-delay:0ms]" />
                <span className="bg-muted-foreground/60 h-1 w-1 animate-bounce rounded-full [animation-delay:150ms]" />
                <span className="bg-muted-foreground/60 h-1 w-1 animate-bounce rounded-full [animation-delay:300ms]" />
              </span>
              <span className="font-semibold text-indigo-400">master</span> is typing…
            </span>
          </span>
        </div>
      )}

      <DiscordChatInput onSend={handleSend} />
    </div>
  )
}
