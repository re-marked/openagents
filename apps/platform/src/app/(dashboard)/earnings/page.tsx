import { DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function EarningsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground">
          Track your revenue and payouts.
        </p>
      </div>

      <Card className="flex flex-1 items-center justify-center border-dashed p-12">
        <div className="text-center">
          <DollarSign className="mx-auto size-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No earnings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish an agent and start earning when users hire it.
          </p>
        </div>
      </Card>
    </div>
  )
}
