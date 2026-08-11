'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { ChefHat, CheckCircle, Bike, Home } from 'lucide-react';
import type { Order } from '@/types';

export default function OrderTrackerClient({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isDeleted, setIsDeleted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to real-time updates for this specific order
    const channel = supabase
      .channel(`order-tracking-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setIsDeleted(true);
          } else if (payload.eventType === 'UPDATE') {
            setOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  const stages = [
    { status: 'PREPARING', label: 'Preparando', message: 'Estamos preparando tu pedido', icon: ChefHat },
    { status: 'READY', label: 'Listo', message: 'Tu pedido está listo', icon: CheckCircle },
    { status: 'OUT_FOR_DELIVERY', label: 'Camino', message: '🛵 Tu pedido va en camino', icon: Bike },
    { status: 'DELIVERED', label: 'Entregado', message: '🏠 ¡Hemos llegado!', icon: Home },
  ];

  // CONFIRMED and PENDING map to PREPARING for the tracker visual
  const currentStatus = (order.status === 'PENDING' || order.status === 'CONFIRMED') ? 'PREPARING' : order.status;
  const currentStageIndex = stages.findIndex(s => s.status === currentStatus);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  if (isDeleted) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl animate-fade-up max-w-md mx-auto w-full flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center text-red-500 mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h2 className="text-xl font-bold font-mono text-white mb-2">Pedido no disponible</h2>
        <p className="text-sm text-neutral-400">Este pedido ha sido eliminado y ya no está disponible en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#E8D5A8' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-bold font-mono text-gray-500">#{order.order_number}</span>
          <h3 className="font-bold text-lg" style={{ color: '#3A2418' }}>Total: €{Number(order.total).toFixed(2)}</h3>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded uppercase ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}`}>
          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
        </span>
      </div>

      <div className="relative mt-8 mb-4">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0"></div>
        {/* Progress Bar Fill */}
        <div 
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
          style={{ 
            backgroundColor: '#A94F2F',
            width: `${(activeIndex / (stages.length - 1)) * 100}%` 
          }}
        ></div>

        <div className="relative z-10 flex justify-between">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={stage.status} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 border-4 border-white shadow-sm ${
                    isCurrent ? 'scale-110' : ''
                  }`}
                  style={{ 
                    backgroundColor: isCompleted ? '#A94F2F' : '#F3E8CC',
                    color: isCompleted ? 'white' : '#65513F'
                  }}
                >
                  <Icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                </div>
                <span 
                  className="text-[10px] uppercase font-bold mt-2 text-center"
                  style={{ color: isCompleted ? '#3A2418' : '#A39171', fontFamily: 'Oswald, sans-serif' }}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Status Message */}
      <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
          {order.status === 'CANCELLED' ? (
            <span className="text-xl">❌</span>
          ) : (
            (() => {
              const Icon = stages[activeIndex]?.icon;
              return Icon ? <Icon className="w-6 h-6" /> : null;
            })()
          )}
        </div>
        <div>
          <p className="text-sm font-bold uppercase text-orange-900" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {order.status === 'CANCELLED' ? 'Pedido cancelado' : stages[activeIndex]?.message}
          </p>
          {order.status === 'OUT_FOR_DELIVERY' && order.driver && (
            <p className="text-xs text-orange-700 mt-1">Repartidor: {order.driver.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}
