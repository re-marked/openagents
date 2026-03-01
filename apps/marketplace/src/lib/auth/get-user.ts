import { cache } from 'react'
import { createClient as createServerClient } from '@agentbay/db/server'

/**
 * Get the authenticated user. Deduplicated within a single RSC render pass
 * via React cache() so layout + page share one Supabase auth round-trip.
 */
export const getUser = cache(async () => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
