'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, MessageCircle, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { formatPrice } from '@/lib/utils';

const TABS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PENDING', label: 'Pendientes' },
  { id: 'CONFIRMED', label: 'Confirmados' },
  { id: 'PREPARING', label: 'Preparando' },
  { id: 'OUT_FOR_DELIVERY', label: 'En camino' },
  { id: 'DELIVERED', label: 'Entregados' },
  { id: 'CANCELLED', label: 'Cancelados' },
];

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!ignore && data) {
        const typedOrders = data as Order[];
        setOrders(typedOrders);

        const idParam = searchParams.get('id');
        if (idParam) {
          const order = typedOrders.find((o) => o.id === idParam);
          if (order) setSelectedOrder(order);
        }
        setLoading(false);
      }
    }

    void loadOrders();
    const interval = setInterval(() => {
      void loadOrders();
    }, 30000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [supabase, searchParams]);

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdating(true);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', selectedOrder.id);

    if (!error) {
      const updatedOrder = { ...selectedOrder, status };
      setSelectedOrder(updatedOrder);
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
    }
    setUpdating(false);
  };

  const filteredOrders =
    activeTab === 'ALL'
      ? orders
      : orders.filter((o) => o.status === activeTab);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex h-[calc(100vh-64px)] md:h-screen flex-col text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>
          Gestión de Pedidos
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-yellow-500 text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="flex-1 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col" style={{ backgroundColor: '#111111' }}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Número</th>
                <th className="px-6 py-4 font-medium">Fecha/Hora</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Teléfono</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    No hay pedidos en esta sección.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`hover:bg-neutral-800/50 cursor-pointer border-b border-neutral-800 transition-colors ${
                      selectedOrder?.id === order.id ? 'bg-neutral-800/80' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-bold" style={{ color: 'var(--brand-yellow)' }}>
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {new Date(order.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold" style={{ color: 'var(--brand-cream)' }}>
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300 font-mono">
                      {order.customer_phone}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ORDER_STATUS_COLORS[order.status] ?? 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-neutral-400 hover:text-white rounded-lg">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Detail */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono" style={{ color: 'var(--brand-yellow)' }}>
                    #{selectedOrder.order_number}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {new Date(selectedOrder.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Selector */}
              <div className="mb-6 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <label className="block text-xs font-bold uppercase text-neutral-400">
                  Actualizar Estado
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus)}
                  disabled={updating}
                  className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-yellow-500 text-sm"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="space-y-4 mb-6 text-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Cliente</h3>
                  <p className="font-bold text-white">{selectedOrder.customer_name}</p>
                  <p className="font-mono text-neutral-300">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-neutral-400">{selectedOrder.customer_email}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Dirección de Entrega</h3>
                  <p className="text-neutral-200">{selectedOrder.delivery_address}</p>
                  {selectedOrder.delivery_zone_name && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                      Zona: {selectedOrder.delivery_zone_name}
                    </span>
                  )}
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Observaciones</h3>
                    <p className="text-xs italic text-yellow-200 bg-yellow-950/40 p-3 rounded-xl border border-yellow-900/50">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* WhatsApp direct contact */}
              <a
                href={`https://wa.me/34${selectedOrder.customer_phone.replace(/\s+/g, '')}?text=${encodeURIComponent(
                  `Hola ${selectedOrder.customer_name}, te escribimos de La Esquina 51 sobre tu pedido #${selectedOrder.order_number}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-6 text-white text-sm"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} />
                <span>Contactar Cliente por WhatsApp</span>
              </a>

              {/* Items summary */}
              <div>
                <h3 className="text-xs font-bold uppercase text-neutral-400 mb-2">Productos</h3>
                <div className="space-y-2 mb-4">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 rounded bg-neutral-950">
                      <div>
                        <span className="font-bold">{item.quantity}x</span> {item.product_name}
                      </div>
                      <span className="font-mono">{formatPrice(item.line_total)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-800 pt-3 flex justify-between items-center text-lg font-bold">
                  <span>TOTAL</span>
                  <span className="font-mono" style={{ color: 'var(--brand-yellow)' }}>
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">Cargando pedidos...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
