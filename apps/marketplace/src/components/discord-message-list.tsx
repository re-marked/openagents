'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownContent } from '@/components/markdown-content'
import { ToolUseBlockList } from '@/components/tool-use-block'
import type { ToolUse } from '@/components/tool-use-block'
import { AgentAvatar } from '@/lib/agents'
import { AgentProfileCard } from '@/components/agent-profile-card'

export interface ThreadMessage {
  agent: string
  content: string
  timestamp: Date
}

export interface Thread {
  id: string
  participants: string[]
  messages: ThreadMessage[]
  complete: boolean
}

export interface DiscordMessage {
  id: string
  role: 'user' | 'master'
  content: string
  timestamp: Date
  thread?: Thread
  toolUses?: ToolUse[]
}

interface MessageGroup {
  role: 'user' | 'master'
  messages: DiscordMessage[]
}

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  master: { bg: 'bg-indigo-600', text: 'text-indigo-400' },
  researcher: { bg: 'bg-emerald-600', text: 'text-emerald-400' },
  coder: { bg: 'bg-amber-600', text: 'text-amber-400' },
  analyst: { bg: 'bg-cyan-600', text: 'text-cyan-400' },
  writer: { bg: 'bg-purple-600', text: 'text-purple-400' },
}

function getAgentColor(agent: string) {
  return AGENT_COLORS[agent] ?? { bg: 'bg-zinc-600', text: 'text-zinc-400' }
}

function getAgentInitial(agent: string): string {
  return agent.charAt(0).toUpperCase()
}

function formatTime(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (isToday) return `Today at ${time}`
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`
}

function groupMessages(messages: DiscordMessage[]): MessageGroup[] {
  return messages.reduce<MessageGroup[]>((groups, msg) => {
    const last = groups[groups.length - 1]
    // Don't group messages that have threads, tool uses, or are streaming — they should stand alone
    const lastMsg = last?.messages[last.messages.length - 1]
    if (last && last.role === msg.role && !msg.thread && !lastMsg?.thread && !msg.toolUses?.length && !lastMsg?.toolUses?.length) {
      last.messages.push(msg)
    } else {
      groups.push({ role: msg.role, messages: [msg] })
    }
    return groups
  }, [])
}

function ThreadView({ thread }: { thread: Thread }) {
  const initiator = thread.participants[0] ?? 'master'
  const invited = thread.participants.slice(1)

  return (
    <div className="mt-2 ml-2 border-l-2 border-indigo-500/20 bg-muted/30 rounded-r-md py-2 px-3">
      {/* Thread header */}
      <div className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
        <span className="capitalize font-medium">{initiator}</span>
        <span>invited</span>
        {invited.map((agent, i) => (
          <span key={agent}>
            <span className={`font-medium ${getAgentColor(agent).text}`}>@{agent}</span>
            {i < invited.length - 1 && <span>, </span>}
          </span>
        ))}
      </div>

      {/* Thread messages */}
      <div className="flex flex-col gap-2">
        {thread.messages.map((msg, i) => {
          const colors = getAgentColor(msg.agent)
          return (
            <div key={`${thread.id}-${i}`} className="flex gap-2 items-start">
              <div className="shrink-0 pt-0.5">
                <div
                  className={`h-6 w-6 rounded-full ${colors.bg} flex items-center justify-center`}
                >
                  <span className="text-white text-[10px] font-semibold">
                    {getAgentInitial(msg.agent)}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-semibold ${colors.text} capitalize`}>
                  {msg.agent}
                </span>
                <MarkdownContent content={msg.content} className="text-foreground/90 text-base break-words" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Loading indicator when thread is still running */}
      {!thread.complete && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="flex gap-0.5">
            <span className="bg-muted-foreground/60 h-1 w-1 animate-bounce rounded-full [animation-delay:0ms]" />
            <span className="bg-muted-foreground/60 h-1 w-1 animate-bounce rounded-full [animation-delay:150ms]" />
            <span className="bg-muted-foreground/60 h-1 w-1 animate-bounce rounded-full [animation-delay:300ms]" />
          </span>
          <span>working...</span>
        </div>
      )}
    </div>
  )
}

function MessageGroupView({ group, agentName, agentCategory, agentIconUrl, agentInstanceId, botBg, botText }: {
  group: MessageGroup
  agentName: string
  agentCategory?: string
  agentIconUrl?: string | null
  agentInstanceId?: string
  botBg: string
  botText: string
}) {
  const isMaster = group.role === 'master'
  const first = group.messages[0]

  return (
    <div className="hover:bg-muted/30 flex gap-4 px-4 py-1 transition-colors">
      {/* Avatar column */}
      <div className="w-10 shrink-0 pt-0.5">
        {isMaster && agentInstanceId ? (
          <AgentProfileCard
            instanceId={agentInstanceId}
            name={agentName}
            category={agentCategory ?? 'general'}
            status="running"
            iconUrl={agentIconUrl}
            side="right"
          >
            <span className="cursor-pointer">
              <AgentAvatar name={agentName} category={agentCategory ?? 'general'} iconUrl={agentIconUrl} size="sm" />
            </span>
          </AgentProfileCard>
        ) : (
          <Avatar>
            <AvatarFallback className="bg-zinc-600 text-white text-xs font-semibold">
              Y
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-semibold ${isMaster ? botText : 'text-foreground'}`}
          >
            {isMaster ? agentName : 'You'}
          </span>
          {isMaster && (
            <Badge className={`${botBg}/20 ${botText} border-0 px-1.5 py-0 text-[10px] font-medium rounded`}>
              BOT
            </Badge>
          )}
          <span className="text-muted-foreground text-xs">{formatTime(first.timestamp)}</span>
        </div>

        {/* Messages */}
        {group.messages.map((msg) => (
          <div key={msg.id}>
            {msg.toolUses && msg.toolUses.length > 0 && (
              <ToolUseBlockList toolUses={msg.toolUses} />
            )}
            <MarkdownContent content={msg.content} className="text-foreground/90 text-base break-words" />
            {msg.thread && <ThreadView thread={msg.thread} />}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DiscordMessageListProps {
  messages: DiscordMessage[]
  agentName?: string
  agentCategory?: string
  agentIconUrl?: string | null
  agentInstanceId?: string
}

const CATEGORY_AVATAR: Record<string, { bg: string; text: string }> = {
  productivity: { bg: 'bg-primary', text: 'text-primary' },
  research: { bg: 'bg-emerald-600', text: 'text-emerald-400' },
  writing: { bg: 'bg-purple-600', text: 'text-purple-400' },
  coding: { bg: 'bg-amber-600', text: 'text-amber-400' },
  business: { bg: 'bg-rose-600', text: 'text-rose-400' },
  creative: { bg: 'bg-pink-600', text: 'text-pink-400' },
  personal: { bg: 'bg-cyan-600', text: 'text-cyan-400' },
}

export function DiscordMessageList({ messages, agentName = 'Agent', agentCategory, agentIconUrl, agentInstanceId }: DiscordMessageListProps) {
  const agentColor = agentCategory ? CATEGORY_AVATAR[agentCategory] : undefined
  const botBg = agentColor?.bg ?? 'bg-primary'
  const botText = agentColor?.text ?? 'text-primary'
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const lastMsg = messages[messages.length - 1]
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]')
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [messages.length, lastMsg?.content, lastMsg?.toolUses?.length])

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <AgentAvatar name={agentName} category={agentCategory ?? 'general'} iconUrl={agentIconUrl} size="lg" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Welcome</h3>
          <p className="text-muted-foreground text-sm">
            This is the beginning of your conversation with {agentName}.
          </p>
        </div>
      </div>
    )
  }

  const groups = groupMessages(messages)

  return (
    <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1" data-lenis-prevent>
      <div className="flex flex-col gap-1 py-4">
        {groups.map((group, i) => (
          <MessageGroupView key={`${group.role}-${group.messages[0].id}-${i}`} group={group} agentName={agentName} agentCategory={agentCategory} agentIconUrl={agentIconUrl} agentInstanceId={agentInstanceId} botBg={botBg} botText={botText} />
        ))}
      </div>
    </ScrollArea>
  )
}
