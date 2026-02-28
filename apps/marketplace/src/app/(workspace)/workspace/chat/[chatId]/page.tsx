import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { redirect } from 'next/navigation'
import { getChatAgents } from '@/lib/chats/queries'
import { getActiveProjectId, getProjectAgents, toAgentInfoList } from '@/lib/projects/queries'
import { ChatPageClient } from './chat-page-client'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { chatId } = await params
  const service = createServiceClient()

  // Verify chat exists and belongs to user
  const { data: chat } = await service
    .from('chats')
    .select('id, name, project_id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (!chat) redirect('/workspace/home')

  // Load chat agents
  const chatAgents = await getChatAgents(chatId)

  // Load all project agents (for the "Add Agent" picker)
  const { activeProjectId } = await getActiveProjectId(user.id)
  const instances = await getProjectAgents(user.id, activeProjectId)
  const allAgents = toAgentInfoList(instances)

  // Find the first running agent to use for the chat panel
  const activeAgent = chatAgents.find(a => a.status === 'running')
    ?? chatAgents.find(a => a.status === 'suspended')
    ?? chatAgents[0]

  return (
    <ChatPageClient
      chatId={chatId}
      chatName={chat.name}
      chatAgents={chatAgents}
      allAgents={allAgents}
      activeAgent={activeAgent ?? null}
    />
  )
}
