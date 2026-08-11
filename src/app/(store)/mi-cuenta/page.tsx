import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon, Package, MapPin } from 'lucide-react';
import OrderTrackerClient from './OrderTrackerClient';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';

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

  // Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
        <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
                {profile?.full_name || user.email}
              </h2>
              <p className="text-xs font-mono" style={{ color: '#65513F' }}>
                {profile?.phone || 'Sin teléfono'} | {user.email}
              </p>
            </div>
          </div>
        </div>

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
        <div className="mt-8">
          <h2 className="font-bold text-2xl uppercase mb-4" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
            Historial de Pedidos
          </h2>
          
          {pastOrders.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
              <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#E8D5A8' }} />
              <p className="text-sm font-bold uppercase" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>Aún no tienes pedidos pasados.</p>
              <Link href="/menu" className="mt-4 inline-block px-6 py-2 rounded font-bold text-xs uppercase" style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}>
                Ver Menú
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pastOrders.map(order => (
                <div key={order.id} className="p-4 rounded-xl border flex flex-col gap-2" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold font-mono" style={{ color: '#65513F' }}>#{order.order_number}</span>
                      <p className="text-sm font-bold" style={{ color: '#3A2418' }}>
                        {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#65513F' }}>
                      <MapPin className="w-3 h-3" /> {order.delivery_address}
                    </div>
                    <span className="font-bold text-lg" style={{ color: '#3A2418' }}>€{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
