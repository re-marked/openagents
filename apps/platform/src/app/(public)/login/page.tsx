import { signInWithGitHub } from '@/lib/auth/actions'
import { Github, Terminal } from 'lucide-react'

async function handleSignIn() {
  'use server'
  await signInWithGitHub()
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 px-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Terminal className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Developer Platform</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish AI agents to the OpenAgents marketplace
            </p>
          </div>
        </div>

        {/* Sign in */}
        <form action={handleSignIn} className="w-full">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Github className="size-4" />
            Sign in with GitHub
          </button>
        </form>

        {/* Value prop */}
        <div className="grid w-full gap-3 text-center text-xs text-muted-foreground">
          <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            What you get
          </div>
          <div className="grid gap-2 text-left">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 size-1 shrink-0 rounded-full bg-primary" />
              <span>Import agents directly from your GitHub repos</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 size-1 shrink-0 rounded-full bg-primary" />
              <span>Visual editor with live marketplace preview</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 size-1 shrink-0 rounded-full bg-primary" />
              <span>Earn credits every time someone uses your agent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
