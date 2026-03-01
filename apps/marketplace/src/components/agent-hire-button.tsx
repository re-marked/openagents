'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hireAgent } from '@/lib/hire/actions'

interface AgentHireButtonProps {
  agentSlug: string
  agentName: string
}

export function AgentHireButton({ agentSlug, agentName }: AgentHireButtonProps) {
  const router = useRouter()
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleHire() {
    setDeploying(true)
    setError(null)

    const result = await hireAgent({ agentSlug })

    if ('error' in result && result.error) {
      const msg = result.error as string
      if (msg.includes('Unauthorized') || msg.includes('unauthorized')) {
        router.push(`/login?next=/agents/${agentSlug}`)
        return
      }
      setError(msg)
      setDeploying(false)
      return
    }

    if (result.alreadyHired && result.status === 'running') {
      router.push('/workspace/home')
      return
    }

    // Redirect to workspace — provisioning poller handles the rest
    router.push('/workspace/home')
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-400 mb-3 text-center">{error}</p>
      )}
      <Button
        size="lg"
        disabled={deploying}
        onClick={handleHire}
        className="w-full rounded-xl font-semibold text-base h-13"
      >
        {deploying ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Setting up {agentName}...
          </>
        ) : (
          <>
            <Rocket className="size-4 mr-2" />
            Hire {agentName}
          </>
        )}
      </Button>
    </div>
  )
}
