import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import OrderTrackerClient from './OrderTrackerClient';
import ProfileSectionClient from './ProfileSectionClient';
import OrderHistoryClient from './OrderHistoryClient';
import type { Order } from '@/types';

export default async function MiCuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch orders and products separately to avoid foreign key error
  const [ordersRes, productsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, image, image_url')
  ]);

  const productsMap = new Map((productsRes.data || []).map((p: Record<string, unknown>) => [p.id, p]));
  const orders = (ordersRes.data || []).map((order: Record<string, unknown>) => ({
    ...order,
    items: (order.items as Record<string, unknown>[])?.map((item: Record<string, unknown>) => ({
      ...item,
      product: productsMap.get(item.product_id as string) || null
    }))
  })) as unknown as Order[];

  const activeOrders = orders?.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)) || [];
  const pastOrders = orders?.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status)) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-wide uppercase" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
          MI CUENTA
        </h1>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-xs font-bold uppercase underline flex items-center gap-1" style={{ color: '#A94F2F', fontFamily: 'Oswald, sans-serif' }}>
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </form>
      </div>

      <div className="grid gap-6">
        {/* Profile Info */}
        <ProfileSectionClient profile={profile} email={user.email || ''} />

        {/* Active Orders Tracker */}
        {activeOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-2xl uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
              Pedido en curso
            </h2>
            {activeOrders.map(order => (
              <OrderTrackerClient key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Order History */}
        <OrderHistoryClient pastOrders={pastOrders} />
      </div>
    </div>
  );
}
