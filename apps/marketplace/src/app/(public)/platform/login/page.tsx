import { signInWithGitHub } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

export default function PlatformLoginPage() {
  async function handleSignIn() {
    'use server'
    await signInWithGitHub()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Creator Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with GitHub to manage your published assistants
          </p>
        </div>

        <form action={handleSignIn}>
          <Button className="w-full" size="lg">
            Continue with GitHub
          </Button>
        </form>
      </div>
    </div>
  )
}
