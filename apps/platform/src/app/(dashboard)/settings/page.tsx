'use client'

import { useState, useEffect, useTransition } from 'react'
import { Key, Copy, Trash2, Plus, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createPublishToken, revokePublishToken } from '@/lib/publish/actions'

interface Token {
  id: string
  name: string
  token_prefix: string
  last_used_at: string | null
  created_at: string
}

export default function SettingsPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [newTokenName, setNewTokenName] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tokens')
      .then((r) => r.json())
      .then((data) => {
        if (data.tokens) setTokens(data.tokens)
      })
  }, [])

  function handleCreateToken() {
    setError(null)
    startTransition(async () => {
      const result = await createPublishToken(newTokenName)
      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('token' in result) {
        setCreatedToken(result.token!)
        setTokens((prev) => [
          {
            id: result.id!,
            name: result.name!,
            token_prefix: result.token_prefix!,
            last_used_at: null,
            created_at: result.created_at!,
          },
          ...prev,
        ])
        setNewTokenName('')
      }
    })
  }

  function handleRevoke(tokenId: string) {
    startTransition(async () => {
      const result = await revokePublishToken(tokenId)
      if ('success' in result && result.success) {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId))
      }
    })
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your creator profile and integrations.
        </p>
      </div>

      <Tabs defaultValue="tokens">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <Key className="mr-2 size-4" />
            API Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Profile editing coming soon. Your profile is synced from your GitHub account.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Publish Tokens</h2>
              <p className="text-sm text-muted-foreground">
                Use tokens to publish agents via the CLI or API.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setCreatedToken(null)
                setNewTokenName('')
                setError(null)
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Create Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {createdToken ? 'Token Created' : 'Create Publish Token'}
                  </DialogTitle>
                </DialogHeader>

                {createdToken ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Copy this token now. You won't be able to see it again.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={createdToken}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdToken)}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => {
                        setDialogOpen(false)
                        setCreatedToken(null)
                      }}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input
                        id="token-name"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        placeholder="e.g., my-ci-token"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button
                      onClick={handleCreateToken}
                      disabled={isPending}
                      className="w-full"
                    >
                      Create Token
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {tokens.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Token</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Last Used</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token) => (
                      <tr key={token.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{token.name}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {token.token_prefix}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(token.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {token.last_used_at
                            ? new Date(token.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRevoke(token.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center border-dashed p-12">
              <div className="text-center">
                <Key className="mx-auto size-10 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No tokens yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a token to publish agents via the CLI.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
