'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChatMessageList } from './chat-message-list'
import { ChatInput } from './chat-input'
import type { ChatMessageData } from './chat-message'
import { Skeleton } from '@/components/ui/skeleton'

export function ChatPanel({ agentInstanceId }: { agentInstanceId: string }) {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/history?agentInstanceId=${agentInstanceId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(
            data.messages.map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as ChatMessageData['role'],
              content: m.content,
            })),
          )
        }
      } catch {
        // Failed to load history — start with empty messages
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [agentInstanceId])

  const handleSend = useCallback(
    async (message: string) => {
      // Optimistic user message
      const userMsgId = `user-${Date.now()}`
      const assistantMsgId = `assistant-${Date.now()}`

      setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: message }])
      setIsStreaming(true)

      // Add empty streaming assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
      ])

      let timeoutId: ReturnType<typeof setTimeout> | null = null
      try {
        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), 6 * 60 * 1000)

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ agentInstanceId, message }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }))
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: `Error: ${err.error}`, isStreaming: false }
                : m,
            ),
          )
          setIsStreaming(false)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          return
        }

        if (!res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: 'Error: No response stream', isStreaming: false }
                : m,
            ),
          )
          setIsStreaming(false)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          return
        }

        // Parse SSE stream.
        // A single run can produce multiple turns (text → tool → text).
        // Each turn ends with a "done" event. Deltas after a "done"
        // start a new assistant message bubble. The "end" event signals
        // the entire run is finished.
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let currentEvent = ''
        let activeMsgId = assistantMsgId
        let turnCount = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim()
              continue
            }

            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim())

                if (currentEvent === 'delta' && data.content !== undefined) {
                  // If the previous turn finished, start a new bubble
                  if (turnCount > 0) {
                    turnCount = 0
                    const newMsgId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
                    activeMsgId = newMsgId
                    setMessages((prev) => [
                      ...prev,
                      { id: newMsgId, role: 'assistant', content: data.content, isStreaming: true },
                    ])
                  } else {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === activeMsgId
                          ? { ...m, content: m.content + data.content }
                          : m,
                      ),
                    )
                  }
                } else if (currentEvent === 'done') {
                  // Finalize this turn's message — but don't close the stream,
                  // more turns may follow.
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === activeMsgId ? { ...m, isStreaming: false } : m,
                    ),
                  )
                  turnCount++
                } else if (currentEvent === 'end') {
                  // Entire run finished
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === activeMsgId ? { ...m, isStreaming: false } : m,
                    ),
                  )
                  setIsStreaming(false)
                  return
                } else if (currentEvent === 'error' || data.error) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === activeMsgId
                        ? {
                            ...m,
                            content: m.content || `Error: ${data.error}`,
                            isStreaming: false,
                          }
                        : m,
                    ),
                  )
                  setIsStreaming(false)
                  return
                }
              } catch {
                // Not valid JSON data line, skip
              }
              currentEvent = ''
            }
          }
        }

        // Stream ended (connection closed) — finalize any in-flight message
        setMessages((prev) =>
          prev.map((m) => (m.id === activeMsgId ? { ...m, isStreaming: false } : m)),
        )
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        const timedOut = err instanceof DOMException && err.name === 'AbortError'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: timedOut ? 'Error: Request timed out' : 'Error: Connection failed', isStreaming: false }
              : m,
          ),
        )
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        setIsStreaming(false)
      }
    },
    [agentInstanceId],
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="ml-auto h-8 w-1/2" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChatMessageList messages={messages} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
