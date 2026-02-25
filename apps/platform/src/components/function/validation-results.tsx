'use client'

import { CheckCircle2, XCircle, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FileCheck } from '@/lib/github/actions'

interface ValidationResultsProps {
  checks: FileCheck[] | null
  isValidating: boolean
}

export function ValidationResults({ checks, isValidating }: ValidationResultsProps) {
  if (isValidating) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking repository structure...
        </div>
      </div>
    )
  }

  if (!checks) return null

  const requiredChecks = checks.filter((c) => c.required)
  const optionalChecks = checks.filter((c) => !c.required)
  const allRequiredPass = requiredChecks.every((c) => c.exists)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-3">Required files</h3>
        <div className="space-y-2">
          {requiredChecks.map((check) => (
            <FileCheckRow key={check.path} check={check} />
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-3">Optional files</h3>
        <div className="space-y-2">
          {optionalChecks.map((check) => (
            <FileCheckRow key={check.path} check={check} />
          ))}
        </div>
      </div>

      {!allRequiredPass && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            Missing required files. Add them to your repository and try again.
          </p>
        </div>
      )}
    </div>
  )
}

function FileCheckRow({ check }: { check: FileCheck }) {
  return (
    <div className="flex items-center gap-2">
      {check.exists ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
      ) : check.required ? (
        <XCircle className="size-4 shrink-0 text-destructive" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground/40" />
      )}
      <span
        className={cn(
          'text-sm font-mono',
          check.exists ? 'text-foreground' : check.required ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {check.label}
      </span>
      {!check.required && !check.exists && (
        <span className="text-xs text-muted-foreground">(optional)</span>
      )}
    </div>
  )
}
