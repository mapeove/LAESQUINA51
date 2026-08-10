import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch store_settings and opening_hours
  const { data: settingsData, error: settingsError } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1)
    .single();

  const { data: hoursData, error: hoursError } = await supabase
    .from('opening_hours')
    .select('*')
    .order('day_of_week', { ascending: true });

  const isConfigured = !settingsError && settingsData;

  const storeOpen = isConfigured ? settingsData?.store_open : true;
  
  // Fallback hours if not configured or error
  const hours = (!hoursError && hoursData && hoursData.length > 0) ? hoursData : [
    { day_of_week: 5, day_name: 'Viernes', open_time: '19:00', close_time: '00:00', is_closed: false },
    { day_of_week: 6, day_name: 'Sábado', open_time: '19:00', close_time: '00:00', is_closed: false },
    { day_of_week: 0, day_name: 'Domingo', open_time: '19:00', close_time: '00:00', is_closed: false }
  ];

  // Dummy logic for current open status based on fallback/actual data
  const isOpenNow = storeOpen; // In a real app, calculate based on current time and hours

  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white" style={{ backgroundColor: 'var(--brand-black, #0A0A0A)' }}>
      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 text-center overflow-hidden">
        {/* Radial glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-md max-h-md rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--brand-yellow, #F5C500)' }}
        />
        
        {/* Open/Closed Badge */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-medium z-10">
          <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isOpenNow ? 'Abierto ahora' : 'Cerrado'}</span>
        </div>

        {/* Logo area */}
        <div className="relative z-10 flex flex-col items-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none" style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", sans-serif)' }}>
            LA<br/>
            ESQUINA<br/>
            <span style={{ color: 'var(--brand-yellow, #F5C500)' }}>51</span>
          </h1>
          <h2 className="mt-4 text-xl md:text-2xl tracking-widest text-neutral-400" style={{ fontFamily: 'var(--font-oswald, Oswald, sans-serif)' }}>
            VENEZUELAN STREET FOOD
          </h2>
          <p className="mt-2 text-neutral-300 italic" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
            Sabor de calle. Sabor de casa.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 flex flex-row items-center justify-center gap-4 w-full max-w-sm">
          <Link 
            href="/menu" 
            className="flex-1 py-4 px-6 rounded-xl font-bold text-lg text-center transition-transform active:scale-95"
            style={{ backgroundColor: 'var(--brand-yellow, #F5C500)', color: 'var(--brand-black, #0A0A0A)' }}
          >
            VER MENÚ
          </Link>
          <Link 
            href="/cart" 
            className="flex-1 py-4 px-6 rounded-xl font-bold text-lg text-center border-2 transition-transform active:scale-95"
            style={{ borderColor: 'var(--brand-yellow, #F5C500)', color: 'var(--brand-yellow, #F5C500)' }}
          >
            HACER PEDIDO
          </Link>
        </div>
      </section>

      {/* DELIVERY BANNER */}
      <div 
        className="w-full py-3 text-center text-sm md:text-base font-bold"
        style={{ backgroundColor: 'var(--brand-yellow, #F5C500)', color: 'var(--brand-black, #0A0A0A)', fontFamily: 'var(--font-oswald, Oswald, sans-serif)' }}
      >
        🛵 ENVÍO GRATIS EN TODA LA ZONA DE REPARTO
      </div>

      <div className="px-4 py-12 max-w-4xl mx-auto w-full flex flex-col gap-8">
        {/* ZONES SECTION */}
        <section className="p-6 rounded-2xl flex flex-col gap-4" style={{ backgroundColor: '#1A1A1A' }}>
          <h3 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-oswald, Oswald, sans-serif)' }}>ZONA DE REPARTO</h3>
          <ul className="flex flex-col gap-3">
            {['Sevilla Centro', 'Triana', 'Los Remedios', 'Macarena'].map(zone => (
              <li key={zone} className="flex items-center gap-3 text-neutral-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-yellow, #F5C500)' }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {zone}
              </li>
            ))}
          </ul>
        </section>

        {/* HOURS SECTION */}
        <section className="p-6 rounded-2xl flex flex-col gap-4" style={{ backgroundColor: '#1A1A1A' }}>
          <h3 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-oswald, Oswald, sans-serif)' }}>HORARIO DE PEDIDOS</h3>
          <ul className="flex flex-col gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {hours.map((h: any, i: number) => (
              <li key={i} className="flex justify-between items-center text-neutral-300 border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
                <span className="font-medium" style={{ fontFamily: 'var(--font-oswald, Oswald, sans-serif)' }}>{h.day_name}</span>
                <span>{h.is_closed ? 'Cerrado' : `${h.open_time} - ${h.close_time}`}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA BOTTOM */}
        <div className="flex justify-center mt-4 mb-8">
          <Link 
            href="/menu" 
            className="py-4 px-10 rounded-xl font-bold text-lg text-center transition-transform active:scale-95 shadow-lg"
            style={{ backgroundColor: 'var(--brand-yellow, #F5C500)', color: 'var(--brand-black, #0A0A0A)' }}
          >
            ¿TIENES HAMBRE?
          </Link>
        </div>
      </div>
    </div>
  );
}
