import { createClient as createServerClient } from '@openagents/db/server'

export async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
