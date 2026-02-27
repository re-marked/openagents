'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Rocket, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AgentPreview } from '@/components/agent-preview'
import { SecurityScan } from '@/components/security-scan'
import { publishAgent } from '@/lib/publish/actions'

export default function ReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const repo = searchParams.get('repo') ?? ''
  const branch = searchParams.get('branch') ?? 'main'

  const [yamlContent, setYamlContent] = useState('')
  const [readmeContent, setReadmeContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setYamlContent(sessionStorage.getItem('agentbay-yaml') ?? '')
    setReadmeContent(sessionStorage.getItem('agentbay-readme') ?? '')
  }, [])

  const handlePublish = async () => {
    setIsPublishing(true)
    setError(null)

    try {
      const result = await publishAgent({
        repoFullName: repo,
        branch,
        yamlContent,
        readmeContent,
      })

      if ('error' in result && result.error) {
        setError(result.error)
        setIsPublishing(false)
        return
      }

      // Clean up sessionStorage
      sessionStorage.removeItem('agentbay-yaml')
      sessionStorage.removeItem('agentbay-readme')
      sessionStorage.removeItem('agentbay-agent-yaml')

      router.push('/agents?published=true')
    } catch (e) {
      setError((e as Error).message)
      setIsPublishing(false)
    }
  }

  if (!yamlContent) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No configuration found. Start from the beginning.</p>
          <Link href="/agents/new" className="mt-2 inline-block text-sm text-primary hover:underline">
            Import from GitHub
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/agents/new/configure?repo=${encodeURIComponent(repo)}&branch=${branch}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Editor
        </Link>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-lg font-semibold">Review & Publish</h1>
          <p className="text-xs text-muted-foreground">{repo}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div>
          <h2 className="text-sm font-medium mb-3">Marketplace Preview</h2>
          <AgentPreview yamlContent={yamlContent} />
        </div>

        {/* Security scan + publish */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-3">Security Scan</h2>
            <SecurityScan yamlContent={yamlContent} readmeContent={readmeContent} />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Rocket className="size-4" />
                Publish to Marketplace
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
