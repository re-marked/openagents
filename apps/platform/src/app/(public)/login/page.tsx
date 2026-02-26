import { signInWithGitHub } from '@/lib/auth/actions'
import { SierpinskiLogo } from '@/components/sierpinski-logo'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <SierpinskiLogo className="size-10 text-foreground" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to the Developer Platform
            </p>
          </div>
        </div>

        <form action={signInWithGitHub.bind(null, '/dashboard')}>
          <Button className="w-full" size="lg">
            <Github className="mr-2 size-4" />
            Continue with GitHub
          </Button>
        </form>
      </div>
    </div>
  )
}
