'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  UtensilsCrossed, 
  Tag, 
  Flame, 
  Truck, 
  Clock, 
  MapPin, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const links = [
  { name: 'Dashboard', href: '/administrador', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/administrador/pedidos', icon: ClipboardList },
  { name: 'Productos', href: '/administrador/productos', icon: UtensilsCrossed },
  { name: 'Categorías', href: '/administrador/categorias', icon: Tag },
  { name: 'Promociones', href: '/administrador/promociones', icon: Flame },
  { name: 'Repartidores', href: '/administrador/repartidores', icon: Truck },
  { name: 'Horarios', href: '/administrador/horarios', icon: Clock },
  { name: 'Zonas', href: '/administrador/zonas', icon: MapPin },
  { name: 'Configuración', href: '/administrador/configuracion', icon: Settings },
];

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/administrador/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-neutral-800 z-50 flex items-center justify-between px-4">
        <span className="font-bold text-lg text-yellow-500 font-mono">LA ESQUINA 51</span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 text-white z-40
        transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 hidden md:flex items-center justify-center border-b border-neutral-800">
          <span className="text-yellow-500 font-bold text-xl uppercase tracking-wider font-mono">La Esquina 51</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/administrador' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive 
                      ? 'bg-yellow-500 text-black font-bold' 
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl text-sm font-semibold transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile spacing block */}
      <div className="h-16 md:hidden" />
    </>
  );
}
