import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'
import { LogOut } from 'lucide-react'
import { getProfile } from '@/lib/settings/actions'
import { ProfileForm } from '@/components/profile-form'

export default async function GeneralSettingsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  if (!profile) {
     // This case should ideally not happen if getUser returns a user, 
     // but if public.users is missing, we might want to handle it or redirect.
     // For now, let's just return null or show an error.
     return <div>Failed to load profile</div>
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background px-4 rounded-t-xl">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="px-8 py-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Profile */}
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm initialData={profile} />
            </CardContent>
          </Card>

          {/* Sign out */}
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Session</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={signOut}>
                <Button variant="outline" type="submit">
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
