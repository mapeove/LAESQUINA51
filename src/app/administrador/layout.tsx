import { AdminSidebar } from './components/AdminSidebar';
import { AdminOrderNotifier } from './components/AdminOrderNotifier';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If unauthenticated, render children directly (allows /administrador/login to render)
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <AdminOrderNotifier />
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden md:pl-60 min-h-screen" style={{ color: '#3A2418' }}>
        {children}
      </main>
    </div>
  );
}
