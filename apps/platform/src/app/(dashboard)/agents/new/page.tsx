import { listRepos } from '@/lib/github/actions'
import { ImportFlow } from '@/components/import-flow'

export default async function NewAgentPage() {
  let initialRepos: Awaited<ReturnType<typeof listRepos>> = { repos: [], hasMore: false }

  try {
    initialRepos = await listRepos(1)
  } catch {
    // Token may be expired — user will see empty state
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import from GitHub</h1>
        <p className="text-sm text-muted-foreground">
          Select a repository containing your agent configuration.
        </p>
      </div>

      <ImportFlow
        initialRepos={initialRepos.repos}
        initialHasMore={initialRepos.hasMore}
      />
    </div>
  )
}
