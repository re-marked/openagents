"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { checkInstanceStatus } from "@/lib/hire/actions"

/**
 * Invisible component that polls provisioning agents and refreshes the page
 * when any of them become running.
 */
export function ProvisioningPoller({ instanceIds }: { instanceIds: string[] }) {
  const router = useRouter()

  useEffect(() => {
    if (instanceIds.length === 0) return

    const interval = setInterval(async () => {
      for (const id of instanceIds) {
        try {
          const status = await checkInstanceStatus(id)
          if (status && (status.status === "running" || status.status === "error")) {
            router.refresh()
            clearInterval(interval)
            return
          }
        } catch {
          // ignore polling errors
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [instanceIds, router])

  return null
}
