import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1. Check if the user is an admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, active')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (adminUser && (adminUser.role === 'OWNER' || adminUser.role === 'admin')) {
      redirect('/administrador');
    }

    // 2. Check if the user is a driver
    const { data: driverUser } = await supabase
      .from('delivery_drivers')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (driverUser) {
      redirect('/repartidor');
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />
      <main className="flex-grow pb-20 md:pb-0 safe-bottom">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
