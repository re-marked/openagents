'use client'

import { useTransition, useState } from 'react'
import { addSubAgent, removeSubAgent } from '@/lib/team/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface TeamMember {
  instanceId: string
  displayName: string
  agentName: string
  agentSlug: string
  status: string
  isMaster: boolean
  roleColor: string
}

interface AvailableRole {
  id: string
  name: string
  tagline: string
  color: string
}

interface TeamSettingsProps {
  members: TeamMember[]
  availableRoles: AvailableRole[]
  teamId: string
}

const COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
  zinc: 'bg-zinc-500',
}

const STATUS_DOT: Record<string, string> = {
  running: 'bg-green-500',
  suspended: 'bg-yellow-500',
  provisioning: 'bg-blue-500 animate-pulse',
  error: 'bg-red-500',
  destroyed: 'bg-zinc-400',
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[status] ?? 'bg-zinc-400'}`}
      title={status}
    />
  )
}

export function TeamSettings({ members, availableRoles, teamId }: TeamSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedRole, setSelectedRole] = useState<string>('')

  const handleAdd = () => {
    if (!selectedRole) return
    startTransition(async () => {
      await addSubAgent({ teamId, roleId: selectedRole })
      setSelectedRole('')
    })
  }

  const handleRemove = (instanceId: string) => {
    startTransition(async () => {
      await removeSubAgent({ instanceId, teamId })
    })
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.instanceId}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-medium ${COLOR_MAP[member.roleColor] ?? 'bg-zinc-500'}`}
              >
                {member.agentName[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.agentName}</span>
                  <StatusDot status={member.status} />
                  <span className="text-muted-foreground text-xs">{member.status}</span>
                </div>
                {member.isMaster ? (
                  <p className="text-muted-foreground text-xs">Team lead</p>
                ) : (
                  <p className="text-muted-foreground text-xs capitalize">{member.displayName}</p>
                )}
              </div>
            </div>

            {!member.isMaster && member.status !== 'destroyed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {member.agentName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will shut down the {member.agentName.toLowerCase()} machine and remove it
                      from your team. You can add it back later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemove(member.instanceId)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      ))}

      {availableRoles.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Add a specialist..." />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${COLOR_MAP[role.color] ?? 'bg-zinc-500'}`}
                    />
                    {role.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={!selectedRole || isPending}
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      )}

      {members.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No team members yet. Visit the home page to set up your workspace.
        </p>
      )}
    </div>
  )
}
