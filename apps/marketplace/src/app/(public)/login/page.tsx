import { signInWithGoogle } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to AgentBay
          </p>
        </div>

        <form action={signInWithGoogle.bind(null, '/workspace/home')}>
          <Button className="w-full" size="lg">
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  )
}
