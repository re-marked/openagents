'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
    >
      Logout
    </button>
  );
}
