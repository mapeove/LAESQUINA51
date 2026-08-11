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
  Settings, 
  Flame, 
  UserCheck 
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersToday: 0,
    salesToday: 0,
    averageTicket: 0,
    pendingCount: 0,
    preparingCount: 0,
    deliveringCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ignore && ordersData) {
        const typedOrders = ordersData as Order[];
        const todayOrders = typedOrders.filter(
          (o) => new Date(o.created_at) >= today && o.status !== 'CANCELLED'
        );

        const salesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const ordersCount = todayOrders.length;
        const avgTicket = ordersCount > 0 ? salesToday / ordersCount : 0;

        const pending = typedOrders.filter((o) => o.status === 'PENDING').length;
        const preparing = typedOrders.filter((o) => o.status === 'PREPARING').length;
        const delivering = typedOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;

        setStats({
          ordersToday: ordersCount,
          salesToday,
          averageTicket: avgTicket,
          pendingCount: pending,
          preparingCount: preparing,
          deliveringCount: delivering,
        });

        setRecentOrders(typedOrders.slice(0, 8));
        setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
            Panel Principal
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Resumen operativo y métricas en tiempo real de La Esquina 51
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/administrador/productos"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-yellow-500 text-black transition-transform active:scale-95"
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </Link>
          <Link
            href="/administrador/promociones"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700"
          >
            <Flame size={16} className="text-yellow-500" />
            <span>Promociones</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pedidos Hoy</span>
            <ShoppingBag size={18} className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">{stats.ordersToday}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ventas Hoy</span>
            <Euro size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold font-mono text-green-400">{formatPrice(stats.salesToday)}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Medio</span>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold font-mono text-blue-400">{formatPrice(stats.averageTicket)}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pendientes</span>
            <Clock size={18} className="text-yellow-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-yellow-400">{stats.pendingCount}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Cocina</span>
            <ChefHat size={18} className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-orange-400">{stats.preparingCount}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Reparto</span>
            <Truck size={18} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-purple-400">{stats.deliveringCount}</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 flex flex-wrap gap-3 items-center justify-between">
        <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Acciones Rápidas:</span>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/administrador/pedidos"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
          >
            📋 Ver Pedidos
          </Link>
          <Link
            href="/administrador/repartidores"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1"
          >
            <UserCheck size={14} /> Repartidores
          </Link>
          <Link
            href="/administrador/horarios"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
          >
            ⏰ Ajustar Horario
          </Link>
          <Link
            href="/administrador/configuracion"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1"
          >
            <Settings size={14} /> Estado Tienda
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900">
        <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-lg font-bold font-mono text-neutral-200">Pedidos Recientes</h2>
          <Link href="/administrador/pedidos" className="text-xs font-bold text-yellow-500 hover:underline">
            Ver Todos los Pedidos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-6 py-3.5 font-medium">Número</th>
                <th className="px-6 py-3.5 font-medium">Cliente</th>
                <th className="px-6 py-3.5 font-medium">Dirección</th>
                <th className="px-6 py-3.5 font-medium">Total</th>
                <th className="px-6 py-3.5 font-medium">Pago</th>
                <th className="px-6 py-3.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs">
                    Cargando dashboard...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs">
                    No hay pedidos registrados aún.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-800/40 border-b border-neutral-800 last:border-0">
                    <td className="px-6 py-4 font-mono font-bold text-yellow-500 text-sm">
                      <Link href={`/administrador/pedidos?id=${order.id}`} className="hover:underline">
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-neutral-200">
                      {order.customer_name}
                      <span className="block text-xs font-mono font-normal text-neutral-400">{order.customer_phone}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-300 max-w-xs truncate">
                      {order.delivery_address}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sm">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${order.payment_method === 'BIZUM' ? 'bg-purple-900/60 text-purple-300' : 'bg-green-900/60 text-green-300'}`}>
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300">
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
