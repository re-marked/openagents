'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DiscordChatPanel } from '@/components/discord-chat-panel'
import { ChatMemberPanel } from '@/components/chat-member-panel'

function toChannelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

interface ChatAgent {
  instanceId: string
  name: string
  slug: string
  category: string
  status: string
  iconUrl: string | null
}

interface ChatPageClientProps {
  chatId: string
  chatName: string
  chatAgents: ChatAgent[]
  allAgents: {
    instanceId: string
    name: string
    slug: string
    category: string
    tagline: string
    status: string
    iconUrl: string | null
  }[]
  activeAgent: ChatAgent | null
}

export function ChatPageClient({
  chatId,
  chatName,
  chatAgents,
  allAgents,
  activeAgent,
}: ChatPageClientProps) {
  const [showMembers, setShowMembers] = useState(true)

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background px-4 rounded-t-xl">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-muted-foreground font-medium">#</span>
          <h1 className="text-sm font-semibold truncate">{toChannelName(chatName)}</h1>
          <span className="text-xs text-muted-foreground">
            {chatAgents.length} {chatAgents.length === 1 ? 'member' : 'members'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMembers(!showMembers)}
          className={showMembers ? 'text-foreground' : 'text-muted-foreground'}
        >
          <Users className="size-4" />
        </Button>
      </header>

      {/* Body: chat + member panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          {activeAgent ? (
            <DiscordChatPanel
              agentInstanceId={activeAgent.instanceId}
              agentName={activeAgent.name}
              agentCategory={activeAgent.category}
              agentStatus={activeAgent.status}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">
                  No agents in this chat yet
                </p>
                <p className="text-muted-foreground/60 text-xs">
                  Add an agent from the members panel to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Member panel */}
        {showMembers && (
          <ChatMemberPanel
            chatId={chatId}
            agents={chatAgents}
            allAgents={allAgents}
          />
        )}
      </div>
    </div>
  )
}
