"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkInstanceStatus } from "@/lib/hire/actions"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const MAX_POLL_TIME_MS = 120_000 // 2 minutes

/**
 * Polls provisioning agents and refreshes the page when any become running.
 * Shows a warning after 2 minutes if still provisioning.
 */
export function ProvisioningPoller({ instanceIds }: { instanceIds: string[] }) {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (instanceIds.length === 0) return

    const startedAt = Date.now()

    const interval = setInterval(async () => {
      if (Date.now() - startedAt > MAX_POLL_TIME_MS) {
        setTimedOut(true)
        clearInterval(interval)
        return
      }

      for (const id of instanceIds) {
        try {
          const status = await checkInstanceStatus(id)
          if (status && (status.status === "running" || status.status === "error")) {
            router.refresh()
            clearInterval(interval)
            return
          }
        } catch {
          // ignore polling errors — will retry
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [instanceIds, router])

  if (timedOut) {
    return (
      <Alert className="mt-6 border-0 bg-amber-500/10">
        <AlertCircle className="size-4 text-amber-400" />
        <AlertTitle className="text-amber-400">Taking longer than expected</AlertTitle>
        <AlertDescription>
          Your agent is still being set up. This can take a few minutes.
          Try refreshing the page in a moment.
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
