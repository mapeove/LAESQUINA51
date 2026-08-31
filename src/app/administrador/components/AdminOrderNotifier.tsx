'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface NewOrderNotification {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
}

export function AdminOrderNotifier() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_order_sound_enabled');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });
  const [notifications, setNotifications] = useState<NewOrderNotification[]>([]);
  const processedIds = useRef<Set<string>>(new Set());
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  // Sync ref with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Initialize audio and unlock listener
  useEffect(() => {
    audioRef.current = new Audio('/sounds/administrador.mp3');

    // Unlock audio context on any user interaction in the admin panel
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.load();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabledRef.current) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/administrador.mp3');
      }
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('Autoplay blocked by browser policy (interact with page to enable audio):', e);
        });
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }, []);

  // Stable Supabase Realtime channel subscription (does not reconnect on sound toggle)
  useEffect(() => {
    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new;
          if (processedIds.current.has(newOrder.id)) return;

          processedIds.current.add(newOrder.id);

          playSound();

          window.dispatchEvent(new CustomEvent('new-admin-order', { detail: newOrder }));

          const notif = {
            id: newOrder.id,
            orderNumber: newOrder.order_number,
            customerName: newOrder.customer_name,
            total: newOrder.total,
          };

          setNotifications((prev) => [...prev, notif]);

          // Auto dismiss after 5s
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== newOrder.id));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, playSound]);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    soundEnabledRef.current = newVal;
    localStorage.setItem('admin_order_sound_enabled', String(newVal));

    if (newVal && audioRef.current) {
      // Play a short preview / test sound when enabling
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <button
        onClick={toggleSound}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mt-2"
        style={{ 
          backgroundColor: soundEnabled ? 'rgba(37, 211, 102, 0.15)' : 'rgba(255, 255, 255, 0.1)',
          color: soundEnabled ? '#25D366' : '#A39171' 
        }}
      >
        <span className="flex items-center gap-2">
          {soundEnabled ? <Bell size={17} /> : <BellOff size={17} />}
          <span>Sonido: {soundEnabled ? 'ON' : 'OFF'}</span>
        </span>
      </button>

      {/* Toasts overlay */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full animate-fade-up">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              className="p-4 rounded-xl shadow-2xl border-l-4 flex flex-col gap-2 relative bg-neutral-900 border-yellow-500"
            >
              <button 
                onClick={() => removeNotification(notif.id)}
                className="absolute top-2 right-2 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2 text-yellow-500">
                <Bell size={16} className="animate-pulse" />
                <span className="text-xs font-bold font-mono tracking-widest uppercase">Nuevo Pedido</span>
              </div>
              
              <div>
                <p className="font-mono font-bold text-lg text-white">#{notif.orderNumber}</p>
                <p className="text-sm text-neutral-300">{notif.customerName} · {formatPrice(notif.total)}</p>
              </div>
              
              <Link 
                href={`/administrador/pedidos?id=${notif.id}`}
                className="text-xs text-yellow-500 hover:text-yellow-400 font-bold mt-1"
                onClick={() => removeNotification(notif.id)}
              >
                VER PEDIDO →
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
