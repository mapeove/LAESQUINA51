import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RepartidorClient from './RepartidorClient';
import type { DeliveryDriver, Order } from '@/types';

export const dynamic = 'force-dynamic';

export default async function RepartidorPage() {
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

  const { data: driver } = await supabase
    .from('delivery_drivers')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (!driver) {
    redirect('/mi-cuenta');
  }

  // Obtener pedidos asignados
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('driver_id', driver.id)
    .in('status', ['READY', 'OUT_FOR_DELIVERY', 'ARRIVED'])
    .order('created_at', { ascending: false });

  return (
    <RepartidorClient 
      initialOrders={(orders as Order[]) || []} 
      driver={driver as DeliveryDriver} 
      currentUserId={user.id} 
    />
  );
}
