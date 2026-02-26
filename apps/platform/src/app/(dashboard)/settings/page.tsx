import { Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your creator profile and integrations.
        </p>
      </div>

      <Card className="flex flex-1 items-center justify-center border-dashed p-12">
        <div className="text-center">
          <Settings className="mx-auto size-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Settings coming soon</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile, Stripe Connect, and GitHub integration settings.
          </p>
        </div>
      </Card>
    </div>
  )
}
