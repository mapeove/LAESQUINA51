import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, ShoppingBag, MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getStoreStatus } from '@/lib/store-status';
import { PromoModal } from '@/components/promo/PromoModal';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { InteractiveProductCard } from '@/components/home/InteractiveProductCard';
import type { Product, Category, Campaign } from '@/types';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch active promotions, categories, products, settings, and opening hours
  const [
    { data: promoData },
    { data: categoriesData },
    { data: productsData },
    { data: settingsData },
    { data: hoursData },
    { data: zonesData }
  ] = await Promise.all([
    supabase.from('campaigns').select('*').eq('active', true).eq('show_modal', true).order('priority', { ascending: false }).limit(1),
    supabase.from('categories').select('*').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('products').select('*, category:categories(*)').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('store_settings').select('*'),
    supabase.from('opening_hours').select('*').order('day_of_week', { ascending: true }),
    supabase.from('delivery_zones').select('*').eq('active', true).order('name', { ascending: true })
  ]);

  const activeCampaign: Campaign | null = (promoData && promoData[0]) ? promoData[0] as Campaign : null;

  // Fallback categories & products if DB empty
  const categories: Category[] = (categoriesData && categoriesData.length > 0) ? categoriesData : [
    { id: 'cat-1', name: 'HAMBURGUESAS VIRALES', slug: 'hamburguesas', description: 'Carne vacuno premium y papas hilo', image: null, active: true, sort_order: 1, created_at: '' },
    { id: 'cat-2', name: 'BOX TENDENCIA', slug: 'box', description: '5 mini burgers + patatas + Coca-Cola', image: null, active: true, sort_order: 2, created_at: '' },
    { id: 'cat-3', name: 'EL REY DE LA PLANCHA', slug: 'plancha', description: 'El Amarre Árabe y tortillas especiales', image: null, active: true, sort_order: 3, created_at: '' },
    { id: 'cat-4', name: 'PERROS CALIENTES', slug: 'perros', description: 'Pan jumbo, salchicha grande y salsas venezolanas', image: null, active: true, sort_order: 4, created_at: '' },
    { id: 'cat-5', name: 'EMPANADAS CON GUASA', slug: 'empanadas', description: 'Masa crujiente y guasacaca de la casa', image: null, active: true, sort_order: 5, created_at: '' },
  ];

  const products: Product[] = (productsData && productsData.length > 0) ? productsData : [
    { id: 'p1', category_id: 'cat-1', name: 'La Casi Triple', slug: 'la-casi-triple', description: 'Carne vacuno premium, huevo frito, cebolla caramelizada, papas hilo, guasacaca. Combo: patatas + Coca-Cola.', price: 8.50, image_url: '/images/products/la-casi-triple.jpg', image: '/images/products/la-casi-triple.jpg', active: true, featured: true, sort_order: 1, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p2', category_id: 'cat-2', name: 'El Box Mini-Monster', slug: 'el-box-mini-monster', description: '5 mini hamburguesas de vacuno premium con bacon o cheddar + patatas fritas + salsas + 1 Coca-Cola.', price: 10.50, image_url: '/images/products/box-mini-monster.png', image: '/images/products/box-mini-monster.png', active: true, featured: true, sort_order: 2, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p3', category_id: 'cat-3', name: 'El Amarre Árabe', slug: 'el-amarre-arabe', description: 'Pan árabe con carne, pollo o mixto, jamón, queso fundido, crema de berenjena y hummus. Incluye Coca-Cola.', price: 9.00, image_url: '/images/products/amarre-arabe.png', image: '/images/products/amarre-arabe.png', active: true, featured: true, sort_order: 3, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p4', category_id: 'cat-4', name: 'Perro-Shawarma', slug: 'perro-shawarma', description: 'Pan jumbo, 1 salchicha grande, carne o pollo de shawarma, ensalada de repollo, cilantro y papitas hilo.', price: 5.50, image_url: '/images/products/chikiturri.png', image: '/images/products/chikiturri.png', active: true, featured: true, sort_order: 4, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p5', category_id: 'cat-5', name: 'La Maracucha Tóxica', slug: 'la-maracucha-toxica', description: 'Empanada crujiente de carne mechada y queso amarillo con guasacaca especial. Incluye Coca-Cola.', price: 4.50, image_url: '/images/products/empanada-incondicional.png', image: '/images/products/empanada-incondicional.png', active: true, featured: false, sort_order: 5, sold_out: false, created_at: '', updated_at: '' },
  ];

  const featuredProducts = products.filter(p => p.featured);

  const storeStatus = await getStoreStatus(supabase);
  const isStoreOpen = storeStatus.isOpen;

  return (
    <main className="min-h-screen pb-24 font-sans selection:bg-[#B88727] selection:text-white" style={{ backgroundColor: '#F3E8CC', color: '#3A2418' }}>
      {/* Promo Modal Component */}
      <PromoModal campaign={activeCampaign} />

      {/* Floating Sticky Cart Bar */}
      <StickyCartBar />

      {/* Top Street Banner */}
      <div className="py-2.5 px-4 font-mono text-xs font-bold text-center tracking-wider uppercase overflow-hidden whitespace-nowrap shadow-sm" style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}>
        <div className="inline-block animate-pulse">
          🛵 PIDE AHORA PARA LLEVAR EN SEVILLA · SABOR VENEZOLANO 100% REAL 🇻🇪
        </div>
      </div>

      {/* A. HERO KRAFT EDITORIAL STREET FOOD SECTION */}
      <section className="relative px-4 pt-6 pb-10 md:py-14 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Open/Closed Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full shadow-sm" style={{ backgroundColor: '#FFF7E5', border: '1px solid #E8D5A8' }}>
            <span className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-emerald-600 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-bold font-mono tracking-wider uppercase" style={{ color: '#3A2418' }}>
              {isStoreOpen ? 'Abierto Ahora para Pedidos' : 'Cerrado Temporalmente'}
            </span>
          </div>

          {/* Main Brand Title */}
          <div className="space-y-1">
            <span className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] font-mono block" style={{ color: '#A94F2F' }}>
              VENEZUELAN STREET FOOD
            </span>
            <h1 
              className="text-6xl md:text-8xl font-bold tracking-tight uppercase leading-none"
              style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}
            >
              LA ESQUINA 51
            </h1>
            <p className="text-sm md:text-lg italic font-serif pt-1" style={{ color: '#65513F' }}>
              &quot;Sabor de calle. Sabor de casa.&quot;
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-md pt-2">
            <Link
              href="/menu"
              className="w-full py-3.5 rounded-2xl font-bold text-xs md:text-sm uppercase tracking-wider transition-transform active:scale-95 text-center flex items-center justify-center gap-2 shadow-md"
              style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
            >
              <ShoppingBag size={17} /> VER MENÚ COMPLETO
            </Link>
            <Link
              href="/cart"
              className="w-full py-3.5 rounded-2xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 shadow-sm"
              style={{ backgroundColor: '#FFF7E5', color: '#3A2418', border: '1px solid #D4C4A0', fontFamily: 'Oswald, sans-serif' }}
            >
              HACER PEDIDO <ArrowRight size={17} />
            </Link>
          </div>

          {/* Editorial Real Photography Collage */}
          <div className="w-full max-w-5xl pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {products.map((product) => (
                <InteractiveProductCard key={product.id} product={product} variant="collage" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* B. SECCIÓN BOX MINI-MONSTER CON FOTOGRAFÍA REAL GRANDE */}
      <section className="px-4 py-6 max-w-6xl mx-auto">
        <div className="p-6 md:p-10 rounded-3xl relative overflow-hidden shadow-md" style={{ backgroundColor: '#FFF7E5', border: '2px solid #E8D5A8' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Image side */}
            <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid #D4C4A0' }}>
              <Image
                src="/images/products/box-mini-monster.png"
                alt="El Box Mini-Monster La Esquina 51"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>

            {/* Content side */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase" style={{ backgroundColor: 'rgba(169,79,47,0.15)', color: '#A94F2F' }}>
                <Flame size={14} /> LO MÁS VIRAL DE SEVILLA
              </div>
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wide leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
                EL BOX MINI-MONSTER
              </h2>
              <p className="text-xs md:text-sm" style={{ color: '#65513F' }}>
                5 mini burguer de ternera premium + ración gigante de patatas fritas crujientes + salsas artesanales de la casa + Coca-Cola bien fría.
              </p>
              <div className="pt-2 flex items-baseline space-x-3">
                <span className="text-3xl md:text-4xl font-bold font-mono" style={{ color: '#A94F2F' }}>{formatPrice(10.50)}</span>
                <span className="text-xs uppercase font-mono tracking-wider" style={{ color: '#65513F' }}>Menú Completo</span>
              </div>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/menu"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase transition-transform active:scale-95 shadow-md"
                  style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
                >
                  <ShoppingBag size={16} />
                  <span>PEDIR AHORA</span>
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase transition-all"
                  style={{ backgroundColor: '#F3E8CC', color: '#3A2418', border: '1px solid #D4C4A0', fontFamily: 'Oswald, sans-serif' }}
                >
                  <span>VER MENÚ</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. LO MÁS PEDIDO EN LA 51 */}
      <section className="px-4 py-8 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: '#E8D5A8' }}>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest block" style={{ color: '#A94F2F' }}>SELECCIÓN ESTRELLA</span>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
              LO MÁS PEDIDO EN LA 51
            </h2>
          </div>
          <Link href="/menu" className="text-xs font-bold hover:underline font-mono" style={{ color: '#B88727' }}>
            VER TODO →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <InteractiveProductCard key={prod.id} product={prod} variant="featured" />
          ))}
        </div>
      </section>

      {/* D. CATEGORÍAS */}
      <section className="px-4 py-8 max-w-6xl mx-auto space-y-6">
        <div className="border-b pb-4" style={{ borderColor: '#E8D5A8' }}>
          <span className="text-xs font-mono font-bold uppercase tracking-widest block" style={{ color: '#A94F2F' }}>EXPLORA EL MENÚ</span>
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
            NUESTRAS CATEGORÍAS
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href="/menu"
              className="p-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 group transition-all shadow-sm hover:shadow-md"
              style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
                <Flame size={20} />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* E. HORARIOS Y ZONAS DE REPARTO */}
      <section className="px-4 py-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horario Card */}
        <div className="p-6 rounded-3xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <div className="flex items-center space-x-2 border-b pb-3" style={{ borderColor: '#E8D5A8', color: '#B88727' }}>
            <Clock size={20} />
            <h3 className="font-bold text-xl uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
              HORARIO DE PEDIDOS
            </h3>
          </div>
          <ul className="space-y-3 text-xs" style={{ color: '#3A2418' }}>
            {hoursData && hoursData.length > 0 ? (
              hoursData.map((h) => {
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                return (
                  <li key={h.id} className="flex justify-between items-center border-b pb-2 last:border-0" style={{ borderColor: '#E8D5A8' }}>
                    <span className="font-bold font-mono">{dayNames[h.day_of_week]}</span>
                    <span>{h.active ? `${h.open_time} - ${h.close_time}` : 'Cerrado'}</span>
                  </li>
                );
              })
            ) : (
              <>
                <li className="flex justify-between items-center border-b pb-2" style={{ borderColor: '#E8D5A8' }}>
                  <span className="font-bold font-mono">Viernes</span>
                  <span>19:00 - 00:00</span>
                </li>
                <li className="flex justify-between items-center border-b pb-2" style={{ borderColor: '#E8D5A8' }}>
                  <span className="font-bold font-mono">Sábado</span>
                  <span>19:00 - 00:00</span>
                </li>
                <li className="flex justify-between items-center pb-2">
                  <span className="font-bold font-mono">Domingo</span>
                  <span>19:00 - 00:00</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Zonas Card */}
        <div className="p-6 rounded-3xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <div className="flex items-center space-x-2 border-b pb-3" style={{ borderColor: '#E8D5A8', color: '#B88727' }}>
            <MapPin size={20} />
            <h3 className="font-bold text-xl uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
              ZONAS DE REPARTO EN SEVILLA
            </h3>
          </div>
          <ul className="space-y-2 text-xs" style={{ color: '#3A2418' }}>
            {zonesData && zonesData.length > 0 ? (
              zonesData.map((z) => (
                <li key={z.id} className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A94F2F' }} />
                  <span className="font-bold">{z.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: '#65513F' }}>({Array.isArray(z.postal_codes) ? z.postal_codes.join(', ') : z.postal_codes})</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A94F2F' }} /><span>Polígono San Pablo (41007)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A94F2F' }} /><span>La Macarena (41009 / 41003)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A94F2F' }} /><span>Centro / Casco Antiguo (41001 / 41002 / 41004)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A94F2F' }} /><span>Hytasa (41010)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A94F2F' }} /><span>El Corte Inglés Nervión (41005)</span></li>
              </>
            )}
          </ul>
        </div>
      </section>

      {/* F. CTA FINAL PEDIDO */}
      <section className="px-4 py-10 max-w-4xl mx-auto text-center space-y-5">
        <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
          ¿TIENES HAMBRE DE CALLE?
        </h2>
        <p className="text-xs md:text-sm max-w-md mx-auto" style={{ color: '#65513F' }}>
          Haz tu pedido ahora mismo. Entrega rápida en tu casa en Sevilla, pago en efectivo o Bizum al recibir.
        </p>
        <div>
          <Link
            href="/menu"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold text-xs md:text-sm uppercase tracking-wider transition-transform active:scale-95 shadow-xl"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
          >
            <ShoppingBag size={18} />
            <span>PEDIR AHORA MISMO</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
