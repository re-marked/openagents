'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { RepoList } from './repo-list'
import { ValidationResults } from './validation-results'
import { validateRepo, type GitHubRepo, type FileCheck } from '@/lib/github/actions'

interface ImportFlowProps {
  initialRepos: GitHubRepo[]
  initialHasMore: boolean
}

type Step = 'select' | 'validate'

export function ImportFlow({ initialRepos, initialHasMore }: ImportFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [checks, setChecks] = useState<FileCheck[] | null>(null)
  const [defaultBranch, setDefaultBranch] = useState<string>('main')
  const [isValidating, startValidation] = useTransition()

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setStep('validate')
    setChecks(null)

    startValidation(async () => {
      const result = await validateRepo(repo.full_name)
      setChecks(result.checks)
      setDefaultBranch(result.defaultBranch)
    })
  }

  const allRequiredPass = checks?.filter((c) => c.required).every((c) => c.exists) ?? false

  const handleContinue = () => {
    if (!selectedRepo) return
    const params = new URLSearchParams({
      repo: selectedRepo.full_name,
      branch: defaultBranch,
    })
    router.push(`/agents/new/configure?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => { setStep('select'); setChecks(null) }}
          className={step === 'select' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}
        >
          1. Select Repository
        </button>
        <span className="text-muted-foreground">/</span>
        <span className={step === 'validate' ? 'font-medium text-foreground' : 'text-muted-foreground'}>
          2. Validate
        </span>
      </div>

      {step === 'select' && (
        <RepoList
          initialRepos={initialRepos}
          initialHasMore={initialHasMore}
          onSelect={handleSelectRepo}
          selectedRepo={selectedRepo}
        />
      )}

      {step === 'validate' && selectedRepo && (
        <div className="space-y-4">
          {/* Selected repo header */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{selectedRepo.full_name}</p>
              {selectedRepo.description && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{selectedRepo.description}</p>
              )}
            </div>
            <button
              onClick={() => { setStep('select'); setChecks(null) }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" />
              Change
            </button>
          </div>

          <ValidationResults checks={checks} isValidating={isValidating} />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setStep('select'); setChecks(null) }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!allRequiredPass || isValidating}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Configure
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
