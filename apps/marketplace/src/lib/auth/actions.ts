'use server'

import { createServerClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${redirectTo ?? '/workspace/home'}`,
    },
  })

  if (error) {
    redirect('/login?error=oauth')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithGitHub(redirectTo?: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${redirectTo ?? '/platform/dashboard'}`,
    },
  })

  if (error) {
    redirect('/login?error=oauth')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
