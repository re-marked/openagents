'use client'

import { useState, useTransition, useCallback } from 'react'
import { Search, Lock, Globe, ChevronRight, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { listRepos, type GitHubRepo } from '@/lib/github/actions'
import { cn } from '@/lib/utils'

interface RepoListProps {
  initialRepos: GitHubRepo[]
  initialHasMore: boolean
  onSelect: (repo: GitHubRepo) => void
  selectedRepo?: GitHubRepo | null
}

export function RepoList({ initialRepos, initialHasMore, onSelect, selectedRepo }: RepoListProps) {
  const [repos, setRepos] = useState(initialRepos)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const doSearch = useCallback(
    (query: string) => {
      setSearch(query)
      startTransition(async () => {
        const result = await listRepos(1, query || undefined)
        setRepos(result.repos)
        setHasMore(result.hasMore)
        setPage(1)
      })
    },
    []
  )

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    startTransition(async () => {
      const result = await listRepos(nextPage, search || undefined)
      setRepos((prev) => [...prev, ...result.repos])
      setHasMore(result.hasMore)
      setPage(nextPage)
    })
  }, [page, search])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          className="pl-9"
          value={search}
          onChange={(e) => doSearch(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[400px] rounded-lg border">
        <div className="divide-y">
          {repos.length === 0 && !isPending && (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              No repositories found.
            </div>
          )}
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelect(repo)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                selectedRepo?.id === repo.id && 'bg-accent'
              )}
            >
              {repo.private ? (
                <Lock className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <Globe className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-sm">{repo.full_name}</span>
                  {repo.language && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {repo.language}
                    </span>
                  )}
                </div>
                {repo.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{repo.description}</p>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {isPending && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      {hasMore && !isPending && (
        <button
          onClick={loadMore}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Load more repositories...
        </button>
      )}
    </div>
  )
}
