'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      type="button"
      className="text-xs font-bold uppercase underline flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
      style={{ color: '#A94F2F', fontFamily: 'Oswald, sans-serif' }}
    >
      <LogOut className="w-4 h-4" />
      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  );
}
