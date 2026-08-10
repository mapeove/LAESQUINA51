import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  READY: 'bg-teal-100 text-teal-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  READY: 'Listo',
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('id, total, status, created_at, customer_name')
    .gte('created_at', startOfToday)
    .order('created_at', { ascending: false });

  const { count: pendingCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['PENDING', 'CONFIRMED', 'PREPARING']);

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const ordersList = todayOrders ?? [];
  const totalRevenue = ordersList
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, order) => sum + (order.total ?? 0), 0);
  const validOrdersCount = ordersList.filter((o) => o.status !== 'CANCELLED').length;
  const averageTicket = validOrdersCount > 0 ? totalRevenue / validOrdersCount : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
      >
        Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pedidos hoy', value: ordersList.length, color: 'var(--brand-yellow)', big: true },
          { label: 'Ventas hoy', value: formatPrice(totalRevenue), color: '#4ade80', big: false },
          { label: 'Ticket medio', value: formatPrice(averageTicket), color: 'white', big: false },
          { label: 'Pendientes', value: pendingCount ?? 0, color: (pendingCount ?? 0) > 0 ? 'var(--brand-red)' : 'white', big: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border border-neutral-800"
            style={{ backgroundColor: '#111111' }}
          >
            <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold" style={{ color: stat.color, fontFamily: 'Bebas Neue, sans-serif' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
        <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>
            Últimos Pedidos
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--brand-yellow)' }}
          >
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                    No hay pedidos recientes.
                  </td>
                </tr>
              ) : (
                (recentOrders ?? []).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders?id=${order.id}`}
                        className="font-mono font-medium hover:underline"
                        style={{ color: 'var(--brand-yellow)' }}
                      >
                        {order.order_number ?? order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-neutral-200">{order.customer_name}</td>
                    <td className="px-5 py-4 font-medium">{formatPrice(order.total ?? 0)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-400">
                      {new Date(order.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
