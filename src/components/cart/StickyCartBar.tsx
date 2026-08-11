'use client';

import { useCart } from '@/features/cart/cart-context';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function StickyCartBar() {
  const { totalItems, subtotal } = useCart();
  const pathname = usePathname();

  // Hide on checkout or cart pages or admin
  if (totalItems === 0 || pathname.startsWith('/checkout') || pathname.startsWith('/cart') || pathname.startsWith('/administrador')) {
    return null;
  }

  return (
    <div className="fixed bottom-18 md:bottom-6 left-0 right-0 z-40 px-4 max-w-lg mx-auto pointer-events-none animate-fade-up">
      <Link
        href="/cart"
        className="pointer-events-auto w-full p-4 rounded-2xl flex items-center justify-between shadow-2xl transition-transform active:scale-98 border"
        style={{ backgroundColor: '#B88727', color: '#FFF7E5', borderColor: '#D4C4A0' }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: 'rgba(255,247,229,0.2)' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-wider block" style={{ fontFamily: 'Oswald, sans-serif' }}>
              VER PEDIDO ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
            </span>
            <span className="text-[11px] font-mono opacity-90">
              Listo para enviar
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold font-mono" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {formatPrice(subtotal)}
          </span>
          <ArrowRight size={18} />
        </div>
      </Link>
    </div>
  );
}
