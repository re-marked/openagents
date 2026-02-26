'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DiscordMessageList, type DiscordMessage } from './discord-message-list'
import type { ToolUse } from './tool-use-block'
import { DiscordChatInput } from './discord-chat-input'
import { Skeleton } from '@/components/ui/skeleton'

interface DiscordChatPanelProps {
  agentInstanceId: string
  agentName?: string
  agentCategory?: string
}

export function DiscordChatPanel({ agentInstanceId, agentName = 'Agent', agentCategory }: DiscordChatPanelProps) {
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
          type RawThread = {
            id: string
            participants: string[]
            messages: { agent: string; content: string }[]
            complete: boolean
          }
          type RawToolUse = {
            id: string
            tool: string
            args?: string
            output?: string
            status: 'running' | 'done' | 'error'
          }
          type RawToolUseJson = RawThread & { tools?: RawToolUse[] }
          setMessages(
            data.messages.map((m: { id: string; role: string; content: string; created_at?: string; tool_use?: RawToolUseJson | null }) => {
              const tu = m.tool_use as RawToolUseJson | null
              // Thread data: present if tool_use has participants (backward compat)
              const hasThread = tu && tu.participants && tu.participants.length > 0
              // Tool uses: present if tool_use has tools array
              const rawTools = tu?.tools ?? []
              return {
                id: m.id,
                role: m.role === 'assistant' ? 'master' : 'user',
                content: m.content,
                timestamp: m.created_at ? new Date(m.created_at) : new Date(),
                thread: hasThread
                  ? {
                      id: String(tu!.id),
                      participants: tu!.participants ?? [],
                      messages: (tu!.messages ?? []).map((tm) => ({
                        agent: tm.agent,
                        content: tm.content,
                        timestamp: m.created_at ? new Date(m.created_at) : new Date(),
                      })),
                      complete: true,
                    }
                  : undefined,
                toolUses: rawTools.length > 0 ? rawTools : undefined,
              }
            }),
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

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
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

      // Read SSE — buffer text, show tool blocks live, drop full message on "done"
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let currentEvent = ''
      let contentBuffer = ''
      let turnCount = 0
      let streamDone = false
      // Track a placeholder message for tool-use blocks (before text arrives)
      let toolMsgId = ''
      const toolAccum: ToolUse[] = []

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''

        for (const line of lines) {
          if (streamDone) break

          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
            continue
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim())

              if (currentEvent === 'delta' && data.content !== undefined) {
                // Buffer silently — text appears all at once on "done"
                contentBuffer += data.content
              } else if (currentEvent === 'tool') {
                // Tool use event — show blocks in real-time
                const toolPayload = data.data ?? data
                const toolId = toolPayload.id ?? `tool-${Date.now()}`
                const toolName = toolPayload.tool ?? toolPayload.name ?? 'unknown'
                const state = data.state ?? toolPayload.state ?? ''

                let args = ''
                if (toolPayload.args) {
                  if (typeof toolPayload.args === 'string') {
                    args = toolPayload.args
                  } else if (toolPayload.args.command) {
                    args = toolPayload.args.command
                  } else if (toolPayload.args.path || toolPayload.args.file) {
                    args = toolPayload.args.path ?? toolPayload.args.file
                  } else if (toolPayload.args.query) {
                    args = toolPayload.args.query
                  } else {
                    args = JSON.stringify(toolPayload.args)
                  }
                }

                // Create a placeholder message for tool blocks if none exists
                if (!toolMsgId) {
                  toolMsgId = `master-tools-${Date.now()}-${turnCount}`
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: toolMsgId,
                      role: 'master',
                      content: '',
                      timestamp: new Date(),
                      toolUses: [],
                    },
                  ])
                }

                if (state === 'start' || state === 'running' || !state) {
                  const newTool: ToolUse = {
                    id: toolId,
                    tool: toolName,
                    args: args || undefined,
                    status: 'running',
                  }
                  toolAccum.push(newTool)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === toolMsgId
                        ? { ...m, toolUses: [...toolAccum] }
                        : m,
                    ),
                  )
                } else if (state === 'end' || state === 'done' || state === 'completed') {
                  const output = toolPayload.output ?? toolPayload.result ?? ''
                  const existing = toolAccum.find((t) => t.id === toolId)
                  if (existing) {
                    existing.status = 'done'
                    existing.output = typeof output === 'string' ? output : JSON.stringify(output)
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === toolMsgId
                        ? { ...m, toolUses: [...toolAccum] }
                        : m,
                    ),
                  )
                } else if (state === 'error') {
                  const existing = toolAccum.find((t) => t.id === toolId)
                  if (existing) {
                    existing.status = 'error'
                    existing.output = toolPayload.error ?? 'Tool error'
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === toolMsgId
                        ? { ...m, toolUses: [...toolAccum] }
                        : m,
                    ),
                  )
                }
              } else if (currentEvent === 'done') {
                // Turn complete — drop the full message at once
                const fullContent = contentBuffer || data.content || ''
                if (toolMsgId && fullContent) {
                  // Merge text into the existing tool-use message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === toolMsgId
                        ? { ...m, content: fullContent }
                        : m,
                    ),
                  )
                } else if (fullContent) {
                  // No tools this turn — just add the message
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
                toolMsgId = ''
                toolAccum.length = 0
                turnCount++
              } else if (currentEvent === 'thread_start') {
                // Attach thread to the last master message (immutable)
                setMessages((prev) => {
                  let lastIdx = -1
                  for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i].role === 'master') { lastIdx = i; break }
                  }
                  if (lastIdx === -1) return prev
                  return prev.map((m, i) =>
                    i === lastIdx
                      ? {
                          ...m,
                          thread: {
                            id: data.threadId,
                            participants: [data.from, data.to],
                            messages: [
                              { agent: data.from, content: data.message, timestamp: new Date() },
                            ],
                            complete: false,
                          },
                        }
                      : m,
                  )
                })
              } else if (currentEvent === 'thread_message') {
                // Add message to active thread (immutable to avoid StrictMode double-push)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.thread?.id === data.threadId
                      ? {
                          ...m,
                          thread: {
                            ...m.thread!,
                            messages: [
                              ...m.thread!.messages,
                              { agent: data.agent, content: data.content, timestamp: new Date() },
                            ],
                          },
                        }
                      : m,
                  ),
                )
              } else if (currentEvent === 'thread_end') {
                // Mark thread complete (immutable)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.thread?.id === data.threadId
                      ? { ...m, thread: { ...m.thread!, complete: true } }
                      : m,
                  ),
                )
              } else if (currentEvent === 'end') {
                // Entire run finished
                streamDone = true
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
                streamDone = true
                break
              }
            } catch {
              // Not valid JSON, skip
            }
            currentEvent = ''
          }
        }
      }

      // If stream ended without a done event but there's buffered content
      if (contentBuffer) {
        if (toolMsgId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === toolMsgId
                ? { ...m, content: contentBuffer }
                : m,
            ),
          )
        } else {
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
      }

      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    } catch (err) {
      console.error('Chat error:', err)
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      const timedOut = err instanceof DOMException && err.name === 'AbortError'
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'master',
          content: timedOut ? 'Request timed out. Please try again.' : 'Connection failed. Please try again.',
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
      <DiscordMessageList messages={messages} agentName={agentName} agentCategory={agentCategory} />

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
              <span className="font-semibold text-primary">{agentName}</span> is typing…
            </span>
          </span>
        </div>
      )}

      <DiscordChatInput onSend={handleSend} />
    </div>
  )
}
