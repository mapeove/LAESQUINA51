import { redirect } from 'next/navigation';
import { AdminSidebar } from './components/AdminSidebar';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Middleware already redirects unauthenticated users, but double-check here
  if (!session) {
    redirect('/admin/login');
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
