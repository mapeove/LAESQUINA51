'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Phone, Navigation } from 'lucide-react';
import OrderChat from '@/components/OrderChat';
import type { Order, DeliveryDriver } from '@/types';

export default function RepartidorClient({ initialOrders, driver, currentUserId }: { initialOrders: Order[], driver: DeliveryDriver, currentUserId: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel('repartidor-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `driver_id=eq.${driver.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? (payload.new as Order) : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver.id, supabase]);

  const activeOrders = orders.filter(o => ['READY', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(o.status));

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert('Error actualizando pedido: ' + error.message);
  };

  const openGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  if (activeOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 rounded-full bg-white border border-[#E8D5A8] flex items-center justify-center text-[#A94F2F] mb-4">
          <MapPin size={24} />
        </div>
        <h2 className="font-bold text-xl" style={{ color: '#3A2418' }}>Sin pedidos asignados</h2>
        <p className="text-sm mt-2 text-[#65513F]">Cuando te asignen un pedido, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {activeOrders.map(order => {
        const fullAddress = `${order.delivery_address}${order.delivery_floor ? `, Piso: ${order.delivery_floor}` : ''}${order.delivery_door ? `, Puerta: ${order.delivery_door}` : ''}`;
        
        return (
          <div key={order.id} className="bg-white border border-[#E8D5A8] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#F3E8CC] border-b border-[#E8D5A8] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold font-mono" style={{ color: '#65513F' }}>#{order.order_number}</span>
                <h3 className="font-bold text-lg" style={{ color: '#3A2418' }}>{order.customer_name}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${order.status === 'READY' ? 'bg-purple-100 text-purple-800' : order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-800' : 'bg-pink-100 text-pink-800'}`}>
                {order.status === 'READY' ? 'LISTO EN LOCAL' : order.status === 'OUT_FOR_DELIVERY' ? 'EN CAMINO' : 'HE LLEGADO'}
              </span>
            </div>

            <div className="p-4 space-y-4 text-sm" style={{ color: '#3A2418' }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-1"><MapPin size={14} className="text-[#A94F2F]" /> Dirección:</p>
                  <p className="mt-1">{fullAddress}</p>
                </div>
                <button 
                  onClick={() => openGoogleMaps(fullAddress)}
                  className="bg-[#FFF7E5] border border-[#E8D5A8] text-[#A94F2F] p-3 rounded-xl ml-2 shadow-sm flex items-center justify-center flex-col gap-1 active:bg-[#F3E8CC]"
                >
                  <Navigation size={18} />
                  <span className="text-[10px] font-bold">MAPS</span>
                </button>
              </div>

              <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <div>
                  <p className="font-medium text-xs text-neutral-500">Teléfono</p>
                  <p className="font-mono">{order.customer_phone}</p>
                </div>
                <a 
                  href={`tel:${order.customer_phone}`}
                  className="bg-green-100 text-green-700 p-3 rounded-xl flex items-center justify-center flex-col gap-1 active:bg-green-200"
                >
                  <Phone size={18} />
                  <span className="text-[10px] font-bold">LLAMAR</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#FFF7E5] p-3 rounded-xl border border-[#E8D5A8]">
                  <p className="text-xs text-[#65513F]">Método Cobro</p>
                  <p className="font-bold">{order.payment_method}</p>
                </div>
                <div className="bg-[#FFF7E5] p-3 rounded-xl border border-[#E8D5A8]">
                  <p className="text-xs text-[#65513F]">Total</p>
                  <p className="font-bold">€{Number(order.total).toFixed(2)}</p>
                </div>
              </div>

              {order.payment_method === 'CASH' && order.cash_change_for && (
                <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <p className="font-bold text-xs">Llevar cambio de €{Number(order.cash_change_for).toFixed(2)}</p>
                </div>
              )}

              {order.notes && (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-200 text-xs">
                  <span className="font-bold">Notas del cliente:</span> {order.notes}
                </div>
              )}

              {/* Botones de acción del repartidor */}
              <div className="pt-4 space-y-3">
                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'ARRIVED')}
                    className="w-full py-4 bg-[#A94F2F] text-white rounded-xl font-bold uppercase tracking-wide active:bg-[#8A3F22] flex justify-center items-center gap-2"
                  >
                    <span>HE LLEGADO</span>
                  </button>
                )}
                
                {order.status === 'ARRIVED' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'DELIVERED')}
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold uppercase tracking-wide active:bg-green-700 flex justify-center items-center gap-2"
                  >
                    <span>PEDIDO ENTREGADO</span>
                  </button>
                )}

                {order.status === 'READY' && (
                  <p className="text-center text-xs text-[#A94F2F] font-bold p-2 bg-[#FFF7E5] rounded-xl border border-[#E8D5A8]">
                    Esperando a que el administrador marque el pedido como EN CAMINO.
                  </p>
                )}
              </div>
              
              {/* Chat */}
              <OrderChat orderId={order.id} currentUserId={currentUserId} userRole="driver" />

            </div>
          </div>
        );
      })}
    </div>
  );
}
