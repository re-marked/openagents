'use server'

import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { revalidatePath } from 'next/cache'

export async function createProject(name: string) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 50) {
    return { error: 'Project name must be 1-50 characters.' }
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('projects')
    .insert({ name: trimmed, user_id: user.id })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to create project.' }
  }

  revalidatePath('/workspace', 'layout')
  return { id: data.id }
}
