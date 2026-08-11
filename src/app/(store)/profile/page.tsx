import { WHATSAPP_NUMBER } from '@/lib/constants';
import Link from 'next/link';
import { User, ShoppingBag, Smartphone, MapPin, Clock } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <h1 className="text-4xl font-bold tracking-wide mb-8 uppercase" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
        MI PERFIL
      </h1>

      <div className="grid gap-6">
        {/* Placeholder for future Auth */}
        <div className="p-6 rounded-2xl border flex flex-col items-center text-center shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-bold text-xl mb-2 uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
            ¿Aún no tienes cuenta?
          </h2>
          <p className="text-xs mb-6 max-w-xs font-mono" style={{ color: '#65513F' }}>
            Crea una cuenta para guardar tus direcciones, ver tu historial de pedidos y ganar puntos en compras futuras.
          </p>
          <div className="flex gap-4 w-full">
            <button className="flex-1 py-3 rounded-xl font-bold uppercase border-2 text-xs transition-colors" style={{ borderColor: '#3A2418', color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>
              Iniciar sesión
            </button>
            <button className="flex-1 py-3 rounded-xl font-bold uppercase text-xs transition-colors shadow-sm" style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}>
              Registrarse
            </button>
          </div>
          <p className="text-[10px] mt-4 italic font-mono" style={{ color: '#65513F' }}>
            * Próximamente habilitaremos el registro de usuarios
          </p>
        </div>

        {/* Quick Links */}
        <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <Link href="/orders" className="flex items-center gap-4 p-5 transition-colors border-b" style={{ borderColor: '#E8D5A8' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(184,135,39,0.15)' }}>
              <ShoppingBag className="w-5 h-5" style={{ color: '#B88727' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Mis Pedidos</h3>
              <p className="text-xs" style={{ color: '#65513F' }}>Busca tus pedidos por número de teléfono</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4 p-5 transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(184,135,39,0.15)' }}>
              <Smartphone className="w-5 h-5" style={{ color: '#B88727' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Instalar App (PWA)</h3>
              <p className="text-xs" style={{ color: '#65513F' }}>Añade La Esquina 51 a tu pantalla de inicio</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="font-bold text-lg mb-4 uppercase border-b pb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}>
            Información de la tienda
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-3 text-sm">
              <MapPin className="w-5 h-5 shrink-0" style={{ color: '#A94F2F' }} />
              <div>
                <p className="font-bold uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>La Esquina 51</p>
                <p className="text-xs" style={{ color: '#65513F' }}>Polígono San Pablo / Sevilla, España</p>
              </div>
            </div>
            
            <div className="flex gap-3 text-sm">
              <Clock className="w-5 h-5 shrink-0" style={{ color: '#A94F2F' }} />
              <div>
                <p className="font-bold uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Horario de Atendimiento</p>
                <p className="text-xs" style={{ color: '#65513F' }}>Viernes, Sábados y Domingos: 19:00 - 00:00</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm pt-2">
              <a 
                href={`https://wa.me/34${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="font-bold underline text-xs font-mono text-emerald-800"
              >
                Contactar por WhatsApp: 34633184354
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
