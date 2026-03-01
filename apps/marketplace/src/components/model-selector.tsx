'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { saveDefaultModel } from '@/lib/settings/actions'

const MODELS = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google' as const,
    description: 'Fast, capable, great for most tasks',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google' as const,
    description: 'Most capable Google model',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai' as const,
    description: 'OpenAI flagship model',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai' as const,
    description: 'Fast and affordable',
  },
  {
    id: 'anthropic/claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic' as const,
    description: 'Excellent at reasoning and coding',
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic' as const,
    description: 'Fast, compact Anthropic model',
  },
]

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
}

interface ModelSelectorProps {
  currentModel: string
  configuredProviders: string[]
}

export function ModelSelector({ currentModel, configuredProviders }: ModelSelectorProps) {
  const [selected, setSelected] = useState(currentModel)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSelect(modelId: string) {
    setSelected(modelId)
    startTransition(async () => {
      const result = await saveDefaultModel(modelId)
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error })
        setSelected(currentModel)
        return
      }
      setMessage({ type: 'success', text: 'Model updated' })
      setTimeout(() => setMessage(null), 3000)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Default Model</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Used by all your Agents. You need the matching API key configured above.
        </p>
      </div>

      {message && (
        <Alert
          variant={message.type === 'error' ? 'destructive' : 'default'}
          className={`border-0 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10'}`}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {MODELS.map((model) => {
          const isSelected = selected === model.id
          const hasKey = configuredProviders.includes(model.provider)

          return (
            <Card
              key={model.id}
              role="button"
              tabIndex={0}
              onClick={() => hasKey && handleSelect(model.id)}
              className={`border-0 gap-0 py-0 cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/10'
                  : hasKey
                    ? 'hover:bg-accent'
                    : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {PROVIDER_LABELS[model.provider]}
                      </Badge>
                      {!hasKey && (
                        <Badge variant="secondary" className="text-[10px] py-0 bg-yellow-400/10 text-yellow-400 border-0">
                          No API key
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                  </div>
                  {isSelected && (
                    isPending ? (
                      <Loader2 className="size-5 text-primary animate-spin" />
                    ) : (
                      <Check className="size-5 text-primary" />
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
