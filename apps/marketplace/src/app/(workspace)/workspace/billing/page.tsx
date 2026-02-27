import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/usage/actions'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, CreditCard, Sparkles } from 'lucide-react'

export default async function BillingPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const balance = await getCreditBalance()

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
              <BreadcrumbPage>Billing</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="px-8 py-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and credits
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Current plan */}
          <Card className="border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <CardDescription className="mt-1">
                    You&apos;re on the free tier with 100 credits
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  Free
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button disabled>
                <Sparkles className="size-4 mr-2" />
                Upgrade (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          {/* Credit balance */}
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="size-5" />
                Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subscription credits</span>
                <span className="font-medium">{balance.subscriptionCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Top-up credits</span>
                <span className="font-medium">{balance.topupCredits}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">{balance.totalCredits}</span>
              </div>
              <Button variant="outline" disabled className="w-full">
                <CreditCard className="size-4 mr-2" />
                Buy Credits (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
