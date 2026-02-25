'use server'

import { createClient, createServiceClient } from '@openagents/db/server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export type ApiKeyProvider = 'openai' | 'anthropic' | 'google'

interface SaveApiKeyParams {
  provider: ApiKeyProvider
  apiKey: string
}

/**
 * Save or update an API key for the current user.
 */
export async function saveApiKey({ provider, apiKey }: SaveApiKeyParams) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  const { error } = await service
    .from('user_api_keys')
    .upsert(
      {
        user_id: user.id,
        provider,
        api_key: apiKey.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    )

  if (error) throw new Error(`Failed to save key: ${error.message}`)

  revalidatePath('/workspace/settings')
  return { success: true }
}

/**
 * Delete an API key for the current user.
 */
export async function deleteApiKey(provider: ApiKeyProvider) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  const { error } = await service
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (error) throw new Error(`Failed to delete key: ${error.message}`)

  revalidatePath('/workspace/settings')
  return { success: true }
}

/**
 * Get all API keys for the current user (masked).
 */
export async function getApiKeys() {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, provider, api_key, updated_at')
    .eq('user_id', user.id)

  if (error) throw new Error(`Failed to load keys: ${error.message}`)

  return (data ?? []).map((row) => ({
    id: row.id,
    provider: row.provider as ApiKeyProvider,
    maskedKey: maskKey(row.api_key),
    updatedAt: row.updated_at,
  }))
}

/**
 * Save the user's default model preference.
 */
export async function saveDefaultModel(modelId: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  const { error } = await service
    .from('users')
    .update({ default_model: modelId })
    .eq('id', user.id)

  if (error) throw new Error(`Failed to save model: ${error.message}`)

  revalidatePath('/workspace/settings')
  return { success: true }
}

/**
 * Get the user's default model preference.
 */
export async function getDefaultModel(): Promise<string> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  const { data } = await service
    .from('users')
    .select('default_model')
    .eq('id', user.id)
    .single()

  return (data as { default_model: string } | null)?.default_model ?? 'google/gemini-2.0-flash'
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
}
