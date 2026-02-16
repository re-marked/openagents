import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          OpenAgents Marketplace
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Deploy and manage your OpenClaw agents
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg border border-border bg-background px-4 py-2 hover:bg-accent"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
