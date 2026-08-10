import { createClient } from '@/lib/supabase/server';
import MenuClient from '@/components/menu/MenuClient';
import type { Category, Product } from '@/types';

const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'HAMBURGUESAS VIRALES', slug: 'hamburguesas', description: null, image: null, active: true, sort_order: 0, created_at: '' },
  { id: '2', name: 'BOX TENDENCIA', slug: 'box', description: null, image: null, active: true, sort_order: 1, created_at: '' },
  { id: '3', name: 'EL REY DE LA PLANCHA', slug: 'plancha', description: null, image: null, active: true, sort_order: 2, created_at: '' },
  { id: '4', name: 'PERROS CALIENTES', slug: 'perros', description: null, image: null, active: true, sort_order: 3, created_at: '' },
  { id: '5', name: 'EMPANADAS CON GUASA', slug: 'empanadas', description: null, image: null, active: true, sort_order: 4, created_at: '' },
];

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p1', category_id: '1', name: 'La Casi Triple', slug: 'la-casi-triple', price: 8.50,
    description: 'Carne de vacuno premium, huevo frito, cebolla caramelizada, papas hilo, guacamole/guasacaca, lechuga, tomate, pepinillos, salsas. Combo: patatas fritas + Coca-Cola.',
    image: null, active: true, featured: true, sort_order: 0, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p2', category_id: '1', name: 'La Primera Cita', slug: 'la-primera-cita', price: 7.50,
    description: 'Carne de vacuno premium, cebolla caramelizada, guacamole/guasacaca, lechuga, tomate, pepinillos, salsas. Sin huevo. Combo: patatas fritas + Coca-Cola.',
    image: null, active: true, featured: false, sort_order: 1, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p3', category_id: '2', name: 'El Box Mini-Monster', slug: 'el-box-mini-monster', price: 10.50,
    description: '5 mini hamburguesas de vacuno premium con bacon, cheddar o lechuga. Incluye patatas fritas, salsas y 1 Coca-Cola.',
    image: null, active: true, featured: true, sort_order: 0, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p4', category_id: '3', name: 'El Amarre Árabe', slug: 'el-amarre-arabe', price: 9.00,
    description: 'Pan árabe o tortilla con carne, pollo o mixto, jamón, queso fundido, lechuga, tomate, cebolla, pepinillos, jalapeños opcionales, crema de berenjena y hummus. Incluye Coca-Cola.',
    image: null, active: true, featured: false, sort_order: 0, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p5', category_id: '4', name: 'Perro-Shawarma', slug: 'perro-shawarma', price: 5.50,
    description: 'Pan jumbo, 1 salchicha grande, carne o pollo de shawarma, ensalada de repollo, zanahoria, cilantro, papitas hilo, kétchup, mayonesa, mostaza. Incluye Coca-Cola.',
    image: null, active: true, featured: false, sort_order: 0, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p6', category_id: '4', name: 'El Chikiturri', slug: 'el-chikiturri', price: 3.50,
    description: 'Menú infantil. Pan suave, 1 salchicha grande, salsas básicas. Incluye zumo de frutas.',
    image: null, active: true, featured: false, sort_order: 1, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p7', category_id: '5', name: 'La Incondicional', slug: 'la-incondicional', price: 3.50,
    description: 'Empanada de jamón y queso. Incluye Coca-Cola.',
    image: null, active: true, featured: false, sort_order: 0, sold_out: false, created_at: '', updated_at: '',
  },
  {
    id: 'p8', category_id: '5', name: 'La Maracucha Tóxica', slug: 'la-maracucha-toxica', price: 4.50,
    description: 'Empanada de carne mechada y queso amarillo. Incluye Coca-Cola.',
    image: null, active: true, featured: false, sort_order: 1, sold_out: false, created_at: '', updated_at: '',
  },
];

export const metadata = {
  title: 'Menú | La Esquina 51 – Venezuelan Street Food en Sevilla',
  description: 'Hamburguesas, boxes, perros calientes, shawarma y empanadas venezolanas. Pide ahora con envío gratis.',
};

export default async function MenuPage() {
  const supabase = await createClient();

  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  const { data: productsData, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  const categories: Category[] =
    !catError && categoriesData && categoriesData.length > 0
      ? categoriesData
      : FALLBACK_CATEGORIES;

  const products: Product[] =
    !prodError && productsData && productsData.length > 0
      ? productsData
      : FALLBACK_PRODUCTS;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-black)' }}>
      <div className="pt-4 pb-2 px-4 max-w-5xl mx-auto">
        <h1
          className="text-4xl font-bold tracking-wide mb-1"
          style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-cream)' }}
        >
          NUESTRO MENÚ
        </h1>
        <p className="text-sm text-neutral-400 mb-2">
          Venezuelan Street Food · Sevilla
        </p>
      </div>
      <MenuClient categories={categories} products={products} />
    </div>
  );
}
