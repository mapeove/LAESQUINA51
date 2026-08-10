import { WHATSAPP_NUMBER } from '@/lib/constants';
import Link from 'next/link';
import { User, ShoppingBag, Smartphone, MapPin, Clock } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bebas tracking-wide mb-8" style={{ color: 'var(--brand-black)' }}>
        MI PERFIL
      </h1>

      <div className="grid gap-6">
        {/* Placeholder for future Auth */}
        <div className="bg-white p-6 rounded-2xl border flex flex-col items-center text-center shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="font-oswald font-bold text-xl mb-2" style={{ color: 'var(--brand-black)' }}>
            ¿Aún no tienes cuenta?
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--brand-gray)' }}>
            Crea una cuenta para guardar tus direcciones, ver tu historial de pedidos y ganar puntos en compras futuras.
          </p>
          <div className="flex gap-4 w-full">
            <button className="flex-1 py-3 rounded-xl font-bold uppercase border-2 transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--brand-black)' }}>
              Iniciar sesión
            </button>
            <button className="flex-1 py-3 rounded-xl font-bold uppercase transition-colors text-white" style={{ backgroundColor: 'var(--brand-black)' }}>
              Registrarse
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">
            * Próximamente habilitaremos el registro de usuarios
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <Link href="/orders" className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-cream)' }}>
              <ShoppingBag className="w-5 h-5" style={{ color: 'var(--brand-black)' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Mis Pedidos</h3>
              <p className="text-xs text-gray-500">Busca tus pedidos por número de teléfono</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-cream)' }}>
              <Smartphone className="w-5 h-5" style={{ color: 'var(--brand-black)' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Instalar App</h3>
              <p className="text-xs text-gray-500">Añade La Esquina 51 a tu pantalla de inicio</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <h2 className="font-oswald font-bold text-lg mb-4" style={{ color: 'var(--brand-black)' }}>
            Información de la tienda
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-3 text-sm">
              <MapPin className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-red)' }} />
              <div>
                <p className="font-medium">La Esquina 51</p>
                <p className="text-gray-500">Calle Ejemplo 123, Sevilla</p>
              </div>
            </div>
            
            <div className="flex gap-3 text-sm">
              <Clock className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-red)' }} />
              <div>
                <p className="font-medium">Horario</p>
                <p className="text-gray-500">Mar - Dom: 19:30 - 23:30</p>
                <p className="text-gray-500">Lunes: Cerrado</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm pt-2">
              <a 
                href={`https://wa.me/34${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="font-medium underline text-green-600"
              >
                Contactar por WhatsApp: 633 184 354
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
