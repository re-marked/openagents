'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { saveApiKey } from '@/lib/settings/actions'
import { renameProject } from '@/lib/projects/actions'
import {
  Key,
  Loader2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  FolderPen,
  Zap,
} from 'lucide-react'

// When hasPlatformKey=true, skip API key step — users can start immediately for free
const STEPS_BYOK = ['workspace', 'apikey'] as const
const STEPS_FREE = ['workspace'] as const

type StepBYOK = (typeof STEPS_BYOK)[number]

export function OnboardingWizard({
  activeProjectId,
  hasPlatformKey = false,
}: {
  activeProjectId: string
  hasPlatformKey?: boolean
}) {
  const router = useRouter()
  const steps = hasPlatformKey ? STEPS_FREE : STEPS_BYOK
  const [step, setStep] = useState<StepBYOK>('workspace')
  const [projectName, setProjectName] = useState('My Workspace')
  const [apiKey, setApiKey] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const currentIndex = (steps as readonly string[]).indexOf(step)

  function handleContinue() {
    const trimmed = projectName.trim()
    if (!trimmed || trimmed.length > 50) {
      setError('Name must be 1-50 characters.')
      return
    }
    setError(null)

    if (hasPlatformKey) {
      // Single step — just rename project and redirect to discover
      startTransition(async () => {
        try {
          const renameResult = await renameProject(activeProjectId, trimmed)
          if ('error' in renameResult && renameResult.error) {
            setError(renameResult.error)
            return
          }
          router.push('/discover')
        } catch (err) {
          setError((err as Error).message)
        }
      })
    } else {
      setStep('apikey')
    }
  }

  function handleSaveKey() {
    if (!apiKey.trim()) return

    startTransition(async () => {
      try {
        // Rename project first
        const renameResult = await renameProject(activeProjectId, projectName.trim())
        if ('error' in renameResult && renameResult.error) {
          setError(renameResult.error)
          return
        }

        // Save API key
        const keyResult = await saveApiKey({ provider: 'google', apiKey: apiKey.trim() })
        if ('error' in keyResult && keyResult.error) {
          setError(keyResult.error as string)
          return
        }

        setError(null)
        router.refresh()
      } catch {
        setError('An unexpected error occurred')
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="max-w-lg w-full">
        {/* Welcome header */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Welcome to AgentBay
        </h2>
        <p className="text-muted-foreground mb-6">
          {hasPlatformKey
            ? 'One quick step and you\u2019re ready to go.'
            : step === 'workspace'
              ? 'Let\u2019s set up your workspace in two quick steps.'
              : 'Almost there \u2014 one more step to go.'}
        </p>

        {/* Free tier badge */}
        {hasPlatformKey && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-sm text-emerald-400 mb-6">
            <Zap className="size-3.5" />
            Free tier active — start chatting without an API key
          </div>
        )}

        {/* Progress indicator */}
        {steps.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-8 bg-muted-foreground/20'
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              Step {currentIndex + 1} of {steps.length}
            </span>
          </div>
        )}

        {/* Step 1: Name workspace */}
        {step === 'workspace' && (
          <Card className="border-0 text-left">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <FolderPen className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Name your workspace</p>
                  <p className="text-xs text-muted-foreground">
                    You can always rename it later in Settings
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="My Workspace"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleContinue()
                  }}
                />
                <Button
                  onClick={handleContinue}
                  disabled={!projectName.trim() || isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : hasPlatformKey ? (
                    <>
                      Get Started
                      <ArrowRight className="size-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-3 border-0 bg-red-500/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {hasPlatformKey && (
                <p className="text-xs text-muted-foreground mt-4">
                  You&apos;re on the free tier — no API key needed to get started.
                  Add your own key anytime in Settings to unlock higher limits.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: API key (BYOK only) */}
        {step === 'apikey' && (
          <Card className="border-0 text-left">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Key className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Add your Google AI API key</p>
                  <p className="text-xs text-muted-foreground">
                    Free to get, takes 60 seconds
                  </p>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary hover:bg-primary/15 transition-colors mb-4"
              >
                <ExternalLink className="size-4 shrink-0" />
                <span>
                  <strong>Get a free key</strong> — Go to Google AI Studio, click
                  &quot;Create API Key&quot;, copy it
                </span>
              </a>

              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveKey()
                  }}
                />
                <Button
                  onClick={handleSaveKey}
                  disabled={isPending || !apiKey.trim()}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Save & Get Started
                      <ArrowRight className="size-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-3 border-0 bg-red-500/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                Your key is stored encrypted and only used to power your agents.
                We never see or share it. You can also use OpenAI or Anthropic keys later in Settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
