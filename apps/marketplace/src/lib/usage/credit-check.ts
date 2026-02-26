import { createServiceClient } from '@openagents/db/server'

/**
 * Get total available credits for a user.
 * Uses service client to bypass RLS.
 */
export async function getUserCredits(userId: string): Promise<number> {
  const service = createServiceClient()
  const { data } = await service
    .from('credit_balances')
    .select('subscription_credits, topup_credits')
    .eq('user_id', userId)
    .single()

  if (!data) return 0
  return (data.subscription_credits ?? 0) + (data.topup_credits ?? 0)
}
