'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCart } from '@/features/cart/cart-context';

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const tabs = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Menú', href: '/menu', icon: UtensilsCrossed },
    { name: 'Pedido', href: '/cart', icon: ShoppingCart, badge: totalItems },
    { name: 'Pedidos', href: '/orders', icon: ClipboardList },
    { name: 'Perfil', href: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-[#1A1A1A] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#F5C500]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-black bg-[#F5C500] rounded-full">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
