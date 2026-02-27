'use server'

import { createClient } from '@agentbay/db/server'

export async function joinWaitlist(formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('waitlist').insert({ email })

  // Treat duplicate as success — don't leak existing signups
  if (error && error.code !== '23505') {
    return { error: 'Something went wrong. Try again.' }
  }

  return { success: true }
}
