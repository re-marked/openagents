import { createClient as createServerClient } from '@agentbay/db/server'

export async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
