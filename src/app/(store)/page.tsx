import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, ShoppingBag, MapPin, Clock, ArrowRight, Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { PromoModal } from '@/components/promo/PromoModal';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import type { Product, Category, Promotion } from '@/types';

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
    supabase.from('promotions').select('*').eq('active', true).eq('show_home', true).order('created_at', { ascending: false }).limit(1),
    supabase.from('categories').select('*').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('products').select('*, category:categories(*)').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('store_settings').select('*'),
    supabase.from('opening_hours').select('*').order('day_of_week', { ascending: true }),
    supabase.from('delivery_zones').select('*').eq('active', true).order('name', { ascending: true })
  ]);

  const activePromo: Promotion | null = (promoData && promoData[0]) ? promoData[0] : null;

  // Fallback fallback categories & products if DB empty
  const categories: Category[] = (categoriesData && categoriesData.length > 0) ? categoriesData : [
    { id: 'cat-1', name: 'HAMBURGUESAS VIRALES', slug: 'hamburguesas', description: 'Carne vacuno premium y papas hilo', image: null, active: true, sort_order: 1, created_at: '' },
    { id: 'cat-2', name: 'BOX TENDENCIA', slug: 'box', description: '5 mini burgers + patatas + Coca-Cola', image: null, active: true, sort_order: 2, created_at: '' },
    { id: 'cat-3', name: 'EL REY DE LA PLANCHA', slug: 'plancha', description: 'El Amarre Árabe y tortillas especiales', image: null, active: true, sort_order: 3, created_at: '' },
    { id: 'cat-4', name: 'PERROS CALIENTES', slug: 'perros', description: 'Pan jumbo, salchicha grande y salsas venezolanas', image: null, active: true, sort_order: 4, created_at: '' },
    { id: 'cat-5', name: 'EMPANADAS CON GUASA', slug: 'empanadas', description: 'Masa crujiente y guasacaca de la casa', image: null, active: true, sort_order: 5, created_at: '' },
  ];

  const products: Product[] = (productsData && productsData.length > 0) ? productsData : [
    { id: 'p1', category_id: 'cat-1', name: 'La Casi Triple', slug: 'la-casi-triple', description: 'Carne vacuno premium, huevo frito, cebolla caramelizada, papas hilo, guasacaca. Combo: patatas + Coca-Cola.', price: 8.50, image: null, active: true, featured: true, sort_order: 1, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p2', category_id: 'cat-2', name: 'El Box Mini-Monster', slug: 'el-box-mini-monster', description: '5 mini hamburguesas de vacuno premium con bacon o cheddar + patatas fritas + salsas + 1 Coca-Cola.', price: 10.50, image: null, active: true, featured: true, sort_order: 2, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p3', category_id: 'cat-3', name: 'El Amarre Árabe', slug: 'el-amarre-arabe', description: 'Pan árabe con carne, pollo o mixto, jamón, queso fundido, crema de berenjena y hummus. Incluye Coca-Cola.', price: 9.00, image: null, active: true, featured: true, sort_order: 3, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p4', category_id: 'cat-4', name: 'Perro-Shawarma', slug: 'perro-shawarma', description: 'Pan jumbo, 1 salchicha grande, carne o pollo de shawarma, ensalada de repollo, cilantro y papitas hilo.', price: 5.50, image: null, active: true, featured: true, sort_order: 4, sold_out: false, created_at: '', updated_at: '' },
    { id: 'p5', category_id: 'cat-5', name: 'La Maracucha Tóxica', slug: 'la-maracucha-toxica', description: 'Empanada crujiente de carne mechada y queso amarillo con guasacaca especial. Incluye Coca-Cola.', price: 4.50, image: null, active: true, featured: false, sort_order: 5, sold_out: false, created_at: '', updated_at: '' },
  ];

  const featuredProducts = products.filter(p => p.featured);
  const promoProduct = activePromo?.product_id ? products.find(p => p.id === activePromo.product_id) : products.find(p => p.slug === 'el-box-mini-monster');

  const storeOpenSetting = settingsData?.find(s => s.key === 'store_open');
  const isStoreOpen = storeOpenSetting ? storeOpenSetting.value === 'true' : true;

  return (
    <main className="min-h-screen pb-24 text-white bg-[#0A0A0A] font-sans selection:bg-yellow-500 selection:text-black">
      {/* Promo Modal Component */}
      <PromoModal promotion={activePromo} product={promoProduct} />

      {/* Floating Sticky Cart Bar */}
      <StickyCartBar />

      {/* Top Street Banner */}
      <div className="bg-yellow-500 text-black py-2.5 px-4 font-mono text-xs font-bold text-center tracking-wider uppercase overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-pulse">
          🛵 ENVÍO GRATIS EN TODA LA ZONA DE REPARTO DE SEVILLA · SABOR VENEZOLANO 100% REAL 🇻🇪
        </div>
      </div>

      {/* A. HERO STREET FOOD SECTION */}
      <section className="relative px-4 pt-8 pb-12 md:py-16 max-w-6xl mx-auto overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Open/Closed Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 backdrop-blur-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-bold font-mono tracking-wider text-neutral-200 uppercase">
              {isStoreOpen ? 'Abierto Ahora para Pedidos' : 'Cerrado Temporalmente'}
            </span>
          </div>

          {/* Main Brand Title */}
          <div className="space-y-1">
            <span className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-neutral-400 font-mono block">
              VENEZUELAN STREET FOOD
            </span>
            <h1 
              className="text-6xl md:text-8xl font-bold tracking-tight text-yellow-500 uppercase leading-none"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              LA ESQUINA 51
            </h1>
            <p className="text-sm md:text-lg text-neutral-300 italic font-medium font-serif pt-1">
              &quot;Sabor de calle. Sabor de casa.&quot;
            </p>
          </div>

          {/* Hero gastronomy food showcase image or placeholder */}
          <div className="relative w-full max-w-md h-64 md:h-80 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900 my-4 group">
            {promoProduct?.image ? (
              <Image
                src={promoProduct.image}
                alt="La Esquina 51 Venezuelan Street Food"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
                sizes="(max-width: 768px) 100vw, 500px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-neutral-950 via-neutral-900 to-neutral-950">
                <Flame className="w-20 h-20 text-yellow-500 mb-3 animate-pulse" />
                <span className="font-mono text-xs font-bold text-yellow-400 uppercase tracking-widest">
                  FOTOGRAFÍA GASTRONÓMICA REAL
                </span>
                <span className="text-xs text-neutral-400 mt-1 max-w-xs">
                  5 Mini Burgers + Patatas + Salsas + Coca-Cola
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
              <div className="text-left">
                <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider block">Estrella de la Casa</span>
                <span className="text-xl font-bold font-mono text-white">El Box Mini-Monster · 10,50 €</span>
              </div>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-md pt-2">
            <Link
              href="/menu"
              className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400 transition-transform active:scale-95 text-center flex items-center justify-center gap-2 shadow-xl"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              <ShoppingBag size={18} /> VER MENÚ COMPLETO
            </Link>
            <Link
              href="/cart"
              className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider bg-neutral-900 text-yellow-400 border border-yellow-500/40 hover:bg-neutral-800 transition-all text-center flex items-center justify-center gap-2"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              HACER PEDIDO <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* B. SECCIÓN PROMOCIONAL DESTACADA (MINI-MONSTER) */}
      <section className="px-4 py-8 max-w-6xl mx-auto">
        <div className="p-6 md:p-10 rounded-3xl bg-neutral-900 border border-yellow-500/30 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold font-mono uppercase">
                <Flame size={14} /> LO MÁS VIRAL DE SEVILLA
              </div>
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wide leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                EL BOX MINI-MONSTER
              </h2>
              <p className="text-xs md:text-sm text-neutral-300">
                5 mini hamburguesas de vacuno premium con bacon crujiente, queso cheddar fundido o lechuga fresca + ración gigante de patatas fritas + salsas artesanales + 1 Coca-Cola bien fría.
              </p>
              <div className="pt-2 flex items-baseline space-x-3">
                <span className="text-3xl md:text-4xl font-bold font-mono text-yellow-500">{formatPrice(10.50)}</span>
                <span className="text-xs text-neutral-400 uppercase font-mono tracking-wider">Menú Completo para Compartir</span>
              </div>
              <div className="pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase bg-yellow-500 text-black hover:bg-yellow-400 transition-transform active:scale-95"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  <ShoppingBag size={16} />
                  <span>PEDIR EL BOX AHORA</span>
                </Link>
              </div>
            </div>

            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              {promoProduct?.image ? (
                <Image
                  src={promoProduct.image}
                  alt="El Box Mini Monster"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Star className="w-12 h-12 text-yellow-500 mx-auto animate-spin" style={{ animationDuration: '8s' }} />
                  <p className="font-mono text-xs text-yellow-400 font-bold uppercase">Fotografía Real del Product Box</p>
                  <p className="text-[10px] text-neutral-500">5 Mini Burgers + Patatas + Salsas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* C. PRODUCTOS DESTACADOS ("LO MÁS PEDIDO EN LA 51") */}
      <section className="px-4 py-8 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-yellow-500 tracking-widest block">SELECCIÓN ESTRELLA</span>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>
              LO MÁS PEDIDO EN LA 51
            </h2>
          </div>
          <Link href="/menu" className="text-xs font-bold text-yellow-500 hover:underline font-mono">
            VER TODO →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <div key={prod.id} className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden flex flex-col justify-between hover:border-yellow-500/40 transition-colors shadow-lg group">
              <div className="relative w-full h-48 bg-neutral-950 flex items-center justify-center overflow-hidden">
                {prod.image ? (
                  <Image
                    src={prod.image}
                    alt={prod.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ShoppingBag className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                    <span className="text-[10px] font-mono text-neutral-500">Foto Real del Producto</span>
                  </div>
                )}
                {prod.sold_out && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold font-mono uppercase rounded-full">
                      AGOTADO
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wide text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    {prod.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                  <span className="text-2xl font-bold font-mono text-yellow-500">{formatPrice(prod.price)}</span>
                  <Link
                    href={`/menu`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-transform active:scale-95 uppercase tracking-wider"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    AÑADIR
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* D. SECCIÓN CATEGORÍAS */}
      <section className="px-4 py-8 max-w-6xl mx-auto space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <span className="text-xs font-mono font-bold uppercase text-yellow-500 tracking-widest block">EXPLORA EL MENÚ</span>
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>
            NUESTRAS CATEGORÍAS
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href="/menu"
              className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-yellow-500 text-center flex flex-col items-center justify-center space-y-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame size={20} />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-neutral-200 group-hover:text-yellow-400" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* E. HORARIOS Y ZONAS DE REPARTO DE SEVILLA */}
      <section className="px-4 py-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horario Card */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 text-yellow-500 border-b border-neutral-800 pb-3">
            <Clock size={20} />
            <h3 className="font-bold text-xl uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif' }}>
              HORARIO DE PEDIDOS
            </h3>
          </div>
          <ul className="space-y-3 text-xs text-neutral-300">
            {hoursData && hoursData.length > 0 ? (
              hoursData.map((h) => {
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                return (
                  <li key={h.id} className="flex justify-between items-center border-b border-neutral-800/60 pb-2 last:border-0">
                    <span className="font-bold font-mono">{dayNames[h.day_of_week]}</span>
                    <span>{h.active ? `${h.open_time} - ${h.close_time}` : 'Cerrado'}</span>
                  </li>
                );
              })
            ) : (
              <>
                <li className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="font-bold font-mono">Viernes</span>
                  <span>19:00 - 00:00</span>
                </li>
                <li className="flex justify-between items-center border-b border-neutral-800 pb-2">
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
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 text-yellow-500 border-b border-neutral-800 pb-3">
            <MapPin size={20} />
            <h3 className="font-bold text-xl uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif' }}>
              ZONAS DE REPARTO EN SEVILLA
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-neutral-300">
            {zonesData && zonesData.length > 0 ? (
              zonesData.map((z) => (
                <li key={z.id} className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="font-bold text-neutral-200">{z.name}</span>
                  <span className="text-neutral-500 font-mono text-[10px]">({Array.isArray(z.postal_codes) ? z.postal_codes.join(', ') : z.postal_codes})</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Polígono San Pablo (41007)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>La Macarena (41009 / 41003)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Centro / Casco Antiguo (41001 / 41002 / 41004)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Hytasa (41010)</span></li>
                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>El Corte Inglés Nervión (41005)</span></li>
              </>
            )}
          </ul>
        </div>
      </section>

      {/* F. CTA FINAL PEDIDO */}
      <section className="px-4 py-12 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight text-yellow-500" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          ¿TIENES HAMBRE DE CALLE?
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 max-w-md mx-auto">
          Haz tu pedido ahora mismo. Entrega rápida en tu casa en Sevilla, pago en efectivo o Bizum al recibir.
        </p>
        <div>
          <Link
            href="/menu"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400 transition-transform active:scale-95 shadow-2xl"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            <ShoppingBag size={20} />
            <span>PEDIR AHORA MISMO</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
