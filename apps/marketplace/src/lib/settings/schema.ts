import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).max(50, {
    message: "Display name must not be longer than 50 characters.",
  }),
  avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
