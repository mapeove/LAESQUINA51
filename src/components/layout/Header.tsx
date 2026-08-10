'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/cart/cart-context';
import { usePathname } from 'next/navigation';

export function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Menú', href: '/menu' },
    { name: 'Mis Pedidos', href: '/orders' },
    { name: 'Perfil', href: '/profile' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile: Centered Logo, Desktop: Left Logo */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <Link href="/" className="font-bebas text-3xl text-[#F5C500] tracking-wider">
            LA ESQUINA 51
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-oswald text-lg transition-colors ${
                  isActive ? 'text-[#F5C500]' : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Cart Icon */}
        <div className="flex-1 md:flex-none flex justify-end">
          <Link href="/cart" className="relative p-2 text-gray-300 hover:text-[#F5C500] transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-black bg-[#F5C500] rounded-full border-2 border-[#0A0A0A]">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
