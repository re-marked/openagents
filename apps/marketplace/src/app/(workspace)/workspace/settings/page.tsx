import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { getApiKeys } from '@/lib/settings/actions'
import { ApiKeysSettings } from '@/components/function/api-keys-settings'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

export default async function UserSettingsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const apiKeys = await getApiKeys()

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4">
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

      <div className="flex-1 overflow-auto px-8 py-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>

        <div className="max-w-2xl space-y-10">
          <ApiKeysSettings initialKeys={apiKeys} />
        </div>
      </div>
    </div>
  )
}
