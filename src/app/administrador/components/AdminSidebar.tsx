'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  UtensilsCrossed, 
  Tag, 
  Megaphone, 
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
  { name: 'Publicidad', href: '/administrador/publicidad', icon: Megaphone },
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4" style={{ backgroundColor: '#3A2418' }}>
        <div>
          <span className="font-bold text-sm tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', color: '#F3E8CC' }}>LA ESQUINA 51</span>
          <span className="block text-[9px] font-mono tracking-widest" style={{ color: '#B88727' }}>ADMINISTRADOR</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2" style={{ color: '#F3E8CC' }}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 z-40
        transition-transform duration-300 ease-in-out flex flex-col border-r
        md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: '#3A2418', borderColor: '#65513F' }}>
        <div className="h-14 hidden md:flex flex-col items-center justify-center border-b" style={{ borderColor: '#65513F' }}>
          <span className="font-bold text-base uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', color: '#F3E8CC' }}>La Esquina 51</span>
          <span className="text-[9px] font-mono tracking-widest" style={{ color: '#B88727' }}>PANEL ADMINISTRADOR</span>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <nav className="space-y-0.5 px-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/administrador' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
                  style={
                    isActive
                      ? { backgroundColor: '#B88727', color: '#3A2418', fontWeight: 700 }
                      : { color: '#F3E8CC' }
                  }
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#65513F'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Icon size={17} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t" style={{ borderColor: '#65513F' }}>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: '#A94F2F' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(169,79,47,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={17} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile spacing block */}
      <div className="h-14 md:hidden" />
    </>
  );
}
