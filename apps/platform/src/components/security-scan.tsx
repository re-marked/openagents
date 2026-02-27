'use client'

import { useMemo } from 'react'
import { CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react'
import { validateAgentBayYaml, scanForSecrets } from '@/lib/publish/validate'

interface SecurityScanProps {
  yamlContent: string
  readmeContent: string
  isScanning?: boolean
}

interface ScanCheck {
  label: string
  passed: boolean
  detail?: string
}

export function SecurityScan({ yamlContent, readmeContent, isScanning }: SecurityScanProps) {
  const checks = useMemo<ScanCheck[]>(() => {
    if (!yamlContent) return []

    const results: ScanCheck[] = []

    // 1. YAML schema validation
    const validation = validateAgentBayYaml(yamlContent)
    results.push({
      label: 'YAML schema valid',
      passed: validation.valid,
      detail: validation.valid ? undefined : validation.errors[0],
    })

    // 2. Secret scan
    const secrets = scanForSecrets(yamlContent)
    results.push({
      label: 'No secrets detected in config',
      passed: secrets.length === 0,
      detail: secrets.length > 0 ? secrets[0] : undefined,
    })

    // 3. README present
    results.push({
      label: 'README.md present',
      passed: readmeContent.length > 0,
    })

    // 4. Description quality
    const parsed = validation.parsed
    results.push({
      label: 'Description is detailed (20+ characters)',
      passed: (parsed?.description?.length ?? 0) >= 20,
    })

    // 5. Slug format
    results.push({
      label: 'Slug is valid',
      passed: /^[a-z0-9-]+$/.test(parsed?.slug ?? ''),
      detail: parsed?.slug ? undefined : 'Missing or invalid slug',
    })

    return results
  }, [yamlContent, readmeContent])

  if (isScanning) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Running security scan...
        </div>
      </div>
    )
  }

  const allPassed = checks.every((c) => c.passed)

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className={`size-4 ${allPassed ? 'text-emerald-500' : 'text-amber-500'}`} />
        <h3 className="text-sm font-medium">
          {allPassed ? 'All checks passed' : 'Some checks need attention'}
        </h3>
      </div>

      <div className="space-y-2.5">
        {checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2">
            {check.passed ? (
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <XCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            )}
            <div>
              <span className="text-sm">{check.label}</span>
              {check.detail && (
                <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
