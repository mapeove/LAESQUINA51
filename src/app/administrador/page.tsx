'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Euro, 
  Clock, 
  ChefHat, 
  Truck, 
  TrendingUp, 
  Plus, 
  Megaphone,
  AlertTriangle,
  Settings,
  ChevronRight
} from 'lucide-react';

interface DashboardOrder {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersToday: 0,
    salesToday: 0,
    averageTicket: 0,
    pendingCount: 0,
    preparingCount: 0,
    deliveringCount: 0,
    soldOutCount: 0,
    activeCampaigns: 0,
  });
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const supabase = createClient();

  const fmtPrice = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, soldOutRes, campaignsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('sold_out', true).eq('active', true),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('active', true),
      ]);

      if (!ignore) {
        const orders = (ordersRes.data || []) as DashboardOrder[];
        const todayOrders = orders.filter(
          (o) => new Date(o.created_at) >= today && o.status !== 'CANCELLED'
        );
        const salesToday = todayOrders.reduce((s, o) => s + o.total, 0);
        const ordersCount = todayOrders.length;

        setStats({
          ordersToday: ordersCount,
          salesToday,
          averageTicket: ordersCount > 0 ? salesToday / ordersCount : 0,
          pendingCount: orders.filter((o) => o.status === 'PENDING').length,
          preparingCount: orders.filter((o) => o.status === 'PREPARING').length,
          deliveringCount: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
          soldOutCount: soldOutRes.count ?? 0,
          activeCampaigns: campaignsRes.count ?? 0,
        });

        setRecentOrders(orders.slice(0, 8));
        setLoading(false);
      }
    }

    void loadDashboard();
    return () => { ignore = true; };
  }, [supabase]);

  const statCards = [
    { label: 'Pedidos Hoy', value: stats.ordersToday, icon: ShoppingBag, color: '#B88727' },
    { label: 'Ventas Hoy', value: fmtPrice(stats.salesToday), icon: Euro, color: '#78866B' },
    { label: 'Ticket Medio', value: fmtPrice(stats.averageTicket), icon: TrendingUp, color: '#A94F2F' },
    { label: 'Pendientes', value: stats.pendingCount, icon: Clock, color: '#B88727' },
    { label: 'Preparando', value: stats.preparingCount, icon: ChefHat, color: '#A94F2F' },
    { label: 'En Reparto', value: stats.deliveringCount, icon: Truck, color: '#78866B' },
    { label: 'Agotados', value: stats.soldOutCount, icon: AlertTriangle, color: '#A94F2F' },
    { label: 'Campañas', value: stats.activeCampaigns, icon: Megaphone, color: '#B88727' },
  ];

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
            Panel Principal
          </h1>
          <p className="text-xs" style={{ color: '#65513F' }}>
            Resumen operativo de La Esquina 51
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/administrador/productos"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-transform active:scale-95"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}
          >
            <Plus size={15} />
            <span>Nuevo Producto</span>
          </Link>
          <Link
            href="/administrador/publicidad"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold text-xs"
            style={{ backgroundColor: '#FFF7E5', color: '#3A2418', border: '1px solid #D4C4A0' }}
          >
            <Megaphone size={15} style={{ color: '#B88727' }} />
            <span>Nueva Publicidad</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 rounded-2xl" style={{ backgroundColor: '#FFF7E5', border: '1px solid #E8D5A8' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#65513F' }}>{card.label}</span>
                <Icon size={16} style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: '#3A2418' }}>
                {typeof card.value === 'number' ? card.value : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-between" style={{ backgroundColor: '#FFF7E5', border: '1px solid #E8D5A8' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#65513F' }}>Acciones Rápidas:</span>
        <div className="flex flex-wrap gap-2">
          <Link href="/administrador/pedidos" className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#F3E8CC', color: '#3A2418', border: '1px solid #D4C4A0' }}>
            📋 Ver Pedidos
          </Link>
          <Link href="/administrador/horarios" className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#F3E8CC', color: '#3A2418', border: '1px solid #D4C4A0' }}>
            ⏰ Cambiar Horario
          </Link>
          <Link href="/administrador/configuracion" className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: '#F3E8CC', color: '#3A2418', border: '1px solid #D4C4A0' }}>
            <Settings size={13} /> Cerrar Tienda
          </Link>
          <Link href="/administrador/repartidores" className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: '#F3E8CC', color: '#3A2418', border: '1px solid #D4C4A0' }}>
            <Truck size={13} /> Repartidores
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#FFF7E5', border: '1px solid #E8D5A8' }}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid #E8D5A8' }}>
          <h2 className="text-base font-bold font-mono" style={{ color: '#3A2418' }}>Pedidos Recientes</h2>
          <Link href="/administrador/pedidos" className="text-xs font-bold hover:underline" style={{ color: '#B88727' }}>
            Ver Todos →
          </Link>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col p-4 gap-3">
          {loading ? (
            <div className="text-center py-8 text-xs font-medium" style={{ color: '#65513F' }}>Cargando...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-xs font-medium" style={{ color: '#65513F' }}>No hay pedidos registrados aún.</div>
          ) : (
            recentOrders.map((order) => (
              <Link 
                href={`/administrador/pedidos?id=${order.id}`}
                key={order.id} 
                className="p-4 rounded-xl flex flex-col gap-3 transition-colors active:bg-[#F3E8CC]/50"
                style={{ backgroundColor: '#fff', border: '1px solid #E8D5A8' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-sm" style={{ color: '#B88727' }}>
                      #{order.order_number}
                    </div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: '#3A2418' }}>{order.customer_name}</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: '#65513F' }}>{order.customer_phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-base" style={{ color: '#3A2418' }}>{fmtPrice(order.total)}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: '#F3E8CC', color: '#65513F' }}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#E8D5A8]/50">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider" style={order.payment_method === 'BIZUM' ? { backgroundColor: 'rgba(120,134,107,0.15)', color: '#78866B' } : { backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
                    {order.payment_method}
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#B88727' }}>Ver <ChevronRight size={14} className="inline" /></span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: '#65513F', borderBottom: '1px solid #E8D5A8' }}>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-xs" style={{ color: '#65513F' }}>Cargando...</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-xs" style={{ color: '#65513F' }}>No hay pedidos registrados aún.</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #E8D5A8' }} className="last:border-0 hover:bg-[#FFF] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: '#B88727' }}>
                      <Link href={`/administrador/pedidos?id=${order.id}`} className="hover:underline">
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#3A2418' }}>
                      {order.customer_name}
                      <span className="block text-[10px] font-mono" style={{ color: '#65513F' }}>{order.customer_phone}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: '#3A2418' }}>{fmtPrice(order.total)}</td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded font-bold" style={order.payment_method === 'BIZUM' ? { backgroundColor: 'rgba(120,134,107,0.15)', color: '#78866B' } : { backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#F3E8CC', color: '#65513F' }}>
                        {order.status}
                      </span>
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
