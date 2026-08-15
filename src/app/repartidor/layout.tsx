import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function RepartidorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if driver
  const { data: driverUser } = await supabase
    .from('delivery_drivers')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (!driverUser) {
    redirect('/mi-cuenta');
  }

  return (
    <div className="min-h-screen bg-[#FFF7E5]">
      <header className="bg-white shadow-sm border-b border-[#E8D5A8] p-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="font-bold text-xl uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Repartidor</h1>
          <p className="text-xs text-[#65513F] font-mono">{driverUser.name}</p>
        </div>
      </header>
      <main className="p-4 max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
}
