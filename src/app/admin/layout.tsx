import { AdminSidebar } from './components/AdminSidebar';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If unauthenticated, render children directly (allows /admin/login to render cleanly without layout sidebar or loops)
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0f0f0f' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden md:pl-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
