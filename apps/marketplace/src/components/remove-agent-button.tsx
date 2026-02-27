'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { removeAgent } from '@/lib/hire/actions'

interface RemoveAgentButtonProps {
  instanceId: string
  agentName: string
}

export function RemoveAgentButton({ instanceId, agentName }: RemoveAgentButtonProps) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const confirmed = confirmText === agentName

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmText('')
      setError(null)
    }
  }

  async function handleRemove() {
    if (!confirmed) return
    setRemoving(true)
    setError(null)

    try {
      await removeAgent(instanceId)
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove agent')
      setRemoving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="size-3 mr-1" />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="transition-all duration-200 ease-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {agentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will shut down the agent and delete all its data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-1">
          <label className="text-sm text-muted-foreground">
            Type <span className="font-semibold text-foreground">{agentName}</span> to confirm
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={agentName}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!confirmed || removing}
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
          >
            {removing && <Loader2 className="size-3 mr-1 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
