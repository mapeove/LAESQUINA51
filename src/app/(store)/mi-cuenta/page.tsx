import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrderTrackerClient from './OrderTrackerClient';
import ProfileSectionClient from './ProfileSectionClient';
import OrderHistoryClient from './OrderHistoryClient';
import LogoutButton from './LogoutButton';
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
        <LogoutButton />
      </div>

      <div className="grid gap-6">
        {/* Profile Info */}
        <ProfileSectionClient profile={profile} email={user.email || ''} />

        {/* Active Orders Tracker */}
        {activeOrders.map(order => (
          <OrderTrackerClient key={order.id} order={order} />
        ))}

        {/* Order History */}
        <OrderHistoryClient pastOrders={pastOrders} />
      </div>
    </div>
  );
}
