'use client';

import Link from 'next/link';
import { ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { useCart } from '@/features/cart/cart-context';
import { usePathname } from 'next/navigation';

export function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Menú', href: '/menu' },
    { name: 'Mis Pedidos', href: '/mi-cuenta' },
    { name: 'Mi Cuenta', href: '/mi-cuenta' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b shadow-sm transition-all" style={{ backgroundColor: 'rgba(255, 247, 229, 0.95)', borderColor: '#E8D5A8' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}>
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <span className="font-bold text-xl md:text-2xl tracking-wider block leading-none" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
                LA ESQUINA 51
              </span>
              <span className="block text-[8px] font-mono tracking-widest uppercase font-bold" style={{ color: '#A94F2F' }}>
                Street Food Venezuelan
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold text-sm uppercase tracking-wider transition-colors py-1 relative"
                style={{
                  fontFamily: 'Oswald, sans-serif',
                  color: isActive ? '#A94F2F' : '#3A2418',
                }}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#A94F2F' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Cart Button */}
        <div className="flex items-center gap-3">
          <Link 
            href="/cart" 
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-sm"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
          >
            <ShoppingCart size={17} />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full" style={{ backgroundColor: '#A94F2F', color: '#FFF7E5' }}>
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
