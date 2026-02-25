'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveApiKey } from '@/lib/settings/actions'
import {
  Key,
  Check,
  Loader2,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState<'key' | 'done'>('key')
  const [apiKey, setApiKey] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSaveKey() {
    if (!apiKey.trim()) return

    startTransition(async () => {
      try {
        await saveApiKey({ provider: 'google', apiKey: apiKey.trim() })
        setStep('done')
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="max-w-lg w-full">
        {/* Welcome */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Welcome to AgentBay
        </h2>
        <p className="text-muted-foreground mb-8">
          One quick step before you can hire your first AI agent.
        </p>

        {step === 'key' && (
          <div className="rounded-2xl bg-card p-6 text-left">
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
              className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-sm text-blue-400 hover:bg-blue-500/15 transition-colors mb-4"
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
                    Save
                    <ArrowRight className="size-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-400 mt-3">{error}</p>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Your key is stored encrypted and only used to power your agents.
              We never see or share it. You can also use OpenAI or Anthropic keys later in Settings.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-green-500/10 p-6">
              <Check className="size-8 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-400">
                You&apos;re all set!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Now go hire your first AI agent from the marketplace.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/discover')}
            >
              Browse Agents
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
