'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateProfile } from '@/lib/settings/actions'
import { profileSchema, type ProfileFormValues } from '@/lib/settings/schema'

interface ProfileFormProps {
  initialData: {
    email?: string
    displayName?: string
    avatarUrl?: string
    provider: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialData.displayName || '',
      avatarUrl: initialData.avatarUrl || '',
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    const result = await updateProfile(data)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated successfully')
      form.reset(data) // Reset dirty state with new data
    }
    setIsLoading(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-x-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={form.watch('avatarUrl') || ''} />
            <AvatarFallback className="text-xl">
              {initialData.email?.[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 w-full max-w-sm">
             <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a URL for your avatar image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input value={initialData.email || ''} disabled />
                <p className="text-[0.8rem] text-muted-foreground">
                    Email address cannot be changed.
                </p>
            </div>
            <div className="space-y-2">
                <FormLabel>Provider</FormLabel>
                <Input value={initialData.provider} disabled className="capitalize" />
                <p className="text-[0.8rem] text-muted-foreground">
                    Account linked via {initialData.provider}.
                </p>
            </div>
        </div>

        <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
          {isLoading ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}
