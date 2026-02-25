'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeAgent } from '@/lib/hire/actions'

interface RemoveAgentButtonProps {
  instanceId: string
  agentName: string
}

export function RemoveAgentButton({ instanceId, agentName }: RemoveAgentButtonProps) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove() {
    if (!confirm) {
      setConfirm(true)
      return
    }

    setRemoving(true)
    setError(null)

    try {
      await removeAgent(instanceId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove agent')
      setRemoving(false)
      setConfirm(false)
    }
  }

  if (error) {
    return <p className="text-xs text-red-400 text-center py-2">{error}</p>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={removing}
      onClick={handleRemove}
      className={`text-xs ${confirm ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {removing ? (
        <Loader2 className="size-3 mr-1 animate-spin" />
      ) : (
        <Trash2 className="size-3 mr-1" />
      )}
      {confirm ? `Remove ${agentName}?` : 'Remove'}
    </Button>
  )
}
