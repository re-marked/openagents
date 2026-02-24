'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface DiscordMessage {
  id: string
  role: 'user' | 'master'
  content: string
  timestamp: Date
}

interface MessageGroup {
  role: 'user' | 'master'
  messages: DiscordMessage[]
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
    if (last && last.role === msg.role) {
      last.messages.push(msg)
    } else {
      groups.push({ role: msg.role, messages: [msg] })
    }
    return groups
  }, [])
}

function MessageGroupView({ group }: { group: MessageGroup }) {
  const isMaster = group.role === 'master'
  const first = group.messages[0]

  return (
    <div className="hover:bg-muted/30 flex gap-4 px-4 py-1 transition-colors">
      {/* Avatar column */}
      <div className="w-10 shrink-0 pt-0.5">
        <Avatar>
          <AvatarFallback
            className={
              isMaster
                ? 'bg-indigo-600 text-white text-xs font-semibold'
                : 'bg-zinc-600 text-white text-xs font-semibold'
            }
          >
            {isMaster ? 'M' : 'Y'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-semibold ${isMaster ? 'text-indigo-400' : 'text-foreground'}`}
          >
            {isMaster ? 'Master' : 'You'}
          </span>
          {isMaster && (
            <Badge className="bg-indigo-600/20 text-indigo-400 border-0 px-1.5 py-0 text-[10px] font-medium rounded">
              BOT
            </Badge>
          )}
          <span className="text-muted-foreground text-xs">{formatTime(first.timestamp)}</span>
        </div>

        {/* Messages */}
        {group.messages.map((msg) => (
          <p key={msg.id} className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        ))}
      </div>
    </div>
  )
}

export function DiscordMessageList({ messages }: { messages: DiscordMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.content])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600">
          <span className="text-2xl font-bold text-white">M</span>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Welcome to #team-chat</h3>
          <p className="text-muted-foreground text-sm">
            This is the beginning of your conversation with Master.
          </p>
        </div>
      </div>
    )
  }

  const groups = groupMessages(messages)

  return (
    <ScrollArea className="h-0 flex-1">
      <div className="flex flex-col gap-1 py-4">
        {groups.map((group, i) => (
          <MessageGroupView key={`${group.role}-${group.messages[0].id}-${i}`} group={group} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
