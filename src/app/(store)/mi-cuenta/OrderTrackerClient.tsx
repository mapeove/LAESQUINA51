'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order } from '@/types';

// Custom inline SVG for scooter/motorcycle
const ScooterIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M11 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    <path d="M21 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    <path d="M11 16.5h5.5" />
    <path d="M6 16.5H4" />
    <path d="M6 14v-2c0-1.5 1-3 2.5-3h4c1.5 0 2.5 1.5 3.5 3l2 2h3" />
    <path d="M13.5 9v-2" />
    <path d="M11 7h5" />
    <path d="M16 11h2" />
  </svg>
);

import OrderChat from '@/components/OrderChat';

export default function OrderTrackerClient({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  const previousStatus = useRef<string>(initialOrder.status);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, [supabase]);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/cliente.mp3');
  }, []);

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
            const newOrder = payload.new as Order;
            if (newOrder.status !== previousStatus.current) {
              previousStatus.current = newOrder.status;
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.warn('Autoplay blocked by browser:', e));
              }
            }
            setOrder(newOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  const stages = [
    { status: 'PENDING', label: 'Recibido', message: 'Hemos recibido tu pedido' },
    { status: 'PREPARING', label: 'Preparando', message: 'Estamos preparando tu pedido' },
    { status: 'READY', label: 'Listo', message: '¡Tu pedido está listo!' },
    { status: 'OUT_FOR_DELIVERY', label: 'En camino', message: 'Tu pedido va en camino' },
    { status: 'ARRIVED', label: 'He llegado', message: '🛵 Tu repartidor ha llegado' },
    { status: 'DELIVERED', label: 'Entregado', message: 'Pedido entregado' },
  ];

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

  if (order.status === 'CANCELLED') {
    return (
      <div className="p-6 rounded-2xl border shadow-sm text-center mb-6" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
         <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4 border" style={{ borderColor: '#FCA5A5' }}>
           <span className="text-3xl">❌</span>
         </div>
         <h2 className="text-xl font-bold uppercase mb-2 tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
           Pedido Cancelado
         </h2>
         <p className="text-sm font-mono" style={{ color: '#65513F' }}>
           Este pedido ha sido cancelado por el administrador.
         </p>
      </div>
    );
  }

  // CONFIRMED historical maps to PENDING (index 0) for safety without breaking
  const currentStatus = order.status === 'CONFIRMED' ? 'PENDING' : order.status;
  const currentStageIndex = stages.findIndex(s => s.status === currentStatus);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  return (
    <div className="p-6 rounded-2xl border bg-white shadow-sm mb-6" style={{ borderColor: '#E8D5A8', backgroundColor: '#FFF7E5' }}>
      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-xs font-bold font-mono" style={{ color: '#65513F' }}>#{order.order_number}</span>
          <h3 className="font-bold text-lg" style={{ color: '#3A2418' }}>Total: €{Number(order.total).toFixed(2)}</h3>
        </div>
        <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded uppercase ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}`}>
          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
        </span>
      </div>

      <div className="relative mb-16 mx-4 sm:mx-8">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-full z-0" style={{ backgroundColor: '#E8D5A8' }}></div>
        
        {/* Progress Bar Fill */}
        <div 
          className="absolute top-0 left-0 h-1.5 rounded-full z-0 transition-all duration-700 ease-in-out motion-reduce:transition-none"
          style={{ 
            backgroundColor: '#A94F2F',
            width: `${(activeIndex / (stages.length - 1)) * 100}%` 
          }}
        ></div>

        {/* Nodes and Labels */}
        {stages.map((stage, idx) => {
          const isCompleted = idx <= activeIndex;
          const leftPercent = (idx / (stages.length - 1)) * 100;
          return (
            <div 
              key={stage.status} 
              className="absolute top-0 flex flex-col items-center -translate-x-1/2" 
              style={{ left: `${leftPercent}%`, width: '80px', marginTop: '-5px' }}
            >
              <div 
                className="w-4 h-4 rounded-full border-2 z-10 transition-colors duration-700 motion-reduce:transition-none"
                style={{ 
                  borderColor: isCompleted ? '#A94F2F' : '#E8D5A8',
                  backgroundColor: isCompleted ? '#A94F2F' : '#FFF7E5'
                }}
              />
              <span 
                className="text-[10px] sm:text-xs uppercase font-bold mt-3 text-center leading-tight tracking-wide"
                style={{ color: isCompleted ? '#3A2418' : '#A39171', fontFamily: 'Oswald, sans-serif' }}
                aria-current={idx === activeIndex ? 'step' : undefined}
              >
                {stage.label}
              </span>
            </div>
          );
        })}

        {/* The Animated Scooter */}
        <div 
          className="absolute top-0 -translate-x-1/2 z-20 transition-all duration-700 ease-in-out motion-reduce:transition-none flex items-center justify-center rounded-full shadow-md border-2"
          style={{ 
            left: `${(activeIndex / (stages.length - 1)) * 100}%`,
            width: '36px',
            height: '36px',
            backgroundColor: '#FFF7E5',
            borderColor: '#B88727',
            color: '#A94F2F',
            marginTop: '-15px' 
          }}
          aria-label={`Progreso actual: ${stages[activeIndex]?.label}`}
        >
          <ScooterIcon className="w-5 h-5" />
        </div>
      </div>
      
      {/* Status Message */}
      <div className="mt-8 p-6 rounded-xl flex items-center justify-center text-center shadow-sm" style={{ backgroundColor: '#F3E8CC', border: '1px solid #E8D5A8' }}>
        <div className="flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>
            {stages[activeIndex]?.message}
          </h2>
          {['OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.status) && order.driver && (
            <p className="text-sm font-mono mt-3 px-4 py-1.5 rounded-full" style={{ color: '#65513F', backgroundColor: 'rgba(184,135,39,0.15)' }}>
              Repartidor: <span className="font-bold">{order.driver.name}</span>
            </p>
          )}
        </div>
      </div>

      {currentUserId && order.driver_id && ['READY', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
        <OrderChat orderId={order.id} currentUserId={currentUserId} userRole="customer" />
      )}
    </div>
  );
}
