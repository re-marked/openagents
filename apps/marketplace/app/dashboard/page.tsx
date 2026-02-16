import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col p-24">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <LogoutButton />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-muted-foreground mb-4">Email: {user.email}</p>
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-2">Your Deployments</h3>
              <p className="text-sm text-muted-foreground">
                No deployments yet. Deploy your first OpenClaw agent to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
