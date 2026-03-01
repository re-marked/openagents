'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { saveApiKey, deleteApiKey, type ApiKeyProvider } from '@/lib/settings/actions'
import { Key, Trash2, Check, Loader2, Plus } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface MaskedKey {
  id: string
  provider: ApiKeyProvider
  maskedKey: string
  updatedAt: string
}

const PROVIDERS: { id: ApiKeyProvider; name: string; placeholder: string; prefix: string }[] = [
  { id: 'google', name: 'Google AI', placeholder: 'AIza...', prefix: 'AIza' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...', prefix: 'sk-' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', prefix: 'sk-ant-' },
]

export function ApiKeysSettings({ initialKeys }: { initialKeys: MaskedKey[] }) {
  const [keys, setKeys] = useState(initialKeys)
  const [editingProvider, setEditingProvider] = useState<ApiKeyProvider | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deletingProvider, setDeletingProvider] = useState<ApiKeyProvider | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSave(provider: ApiKeyProvider) {
    if (!inputValue.trim()) return

    startTransition(async () => {
      try {
        await saveApiKey({ provider, apiKey: inputValue })
        setKeys((prev) => {
          const existing = prev.find((k) => k.provider === provider)
          const masked = inputValue.slice(0, 4) + '••••••••' + inputValue.slice(-4)
          if (existing) {
            return prev.map((k) =>
              k.provider === provider
                ? { ...k, maskedKey: masked, updatedAt: new Date().toISOString() }
                : k
            )
          }
          return [...prev, { id: crypto.randomUUID(), provider, maskedKey: masked, updatedAt: new Date().toISOString() }]
        })
        setEditingProvider(null)
        setInputValue('')
        setMessage({ type: 'success', text: `${provider} key saved` })
        setTimeout(() => setMessage(null), 3000)
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message })
      }
    })
  }

  function handleDelete(provider: ApiKeyProvider) {
    startTransition(async () => {
      try {
        await deleteApiKey(provider)
        setKeys((prev) => prev.filter((k) => k.provider !== provider))
        setMessage({ type: 'success', text: `${provider} key removed` })
        setTimeout(() => setMessage(null), 3000)
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Keys</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your keys are used to power your Agents. They&apos;re stored encrypted and never shared.
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

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const existing = keys.find((k) => k.provider === provider.id)
          const isEditing = editingProvider === provider.id

          return (
            <Card key={provider.id} className="border-0 gap-0 py-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                      <Key className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{provider.name}</p>
                      {existing && !isEditing ? (
                        <p className="text-xs text-muted-foreground font-mono">{existing.maskedKey}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {existing ? 'Update your key' : 'Not configured'}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      {existing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          onClick={() => setDeletingProvider(provider.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProvider(provider.id)
                          setInputValue('')
                        }}
                      >
                        {existing ? 'Update' : <><Plus className="size-3 mr-1" /> Add</>}
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      type="password"
                      placeholder={provider.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="font-mono text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(provider.id)
                        if (e.key === 'Escape') {
                          setEditingProvider(null)
                          setInputValue('')
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(provider.id)}
                      disabled={isPending || !inputValue.trim()}
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProvider(null)
                        setInputValue('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* API key delete confirmation */}
      <ConfirmDialog
        open={deletingProvider !== null}
        onOpenChange={(open) => { if (!open) setDeletingProvider(null) }}
        title={`Remove ${PROVIDERS.find((p) => p.id === deletingProvider)?.name ?? ''} API key?`}
        description="Your agents using this provider will stop working until a new key is added."
        confirmLabel="Remove"
        onConfirm={() => {
          if (deletingProvider) {
            handleDelete(deletingProvider)
            setDeletingProvider(null)
          }
        }}
      />
    </div>
  )
}
