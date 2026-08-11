'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/features/cart/cart-context';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Banknote, Wallet, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bizumPhone, setBizumPhone] = useState('633184354');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_postal_code: '41007',
    delivery_zone: 'Polígono San Pablo / 41007',
    delivery_floor: '',
    delivery_door: '',
    notes: '',
    payment_method: 'CASH' as 'CASH' | 'BIZUM',
    cash_change_for: '',
  });

  useEffect(() => {
    let ignore = false;
    async function loadBizumPhone() {
      const { data } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'bizum_phone')
        .single();

      if (!ignore && data?.value) {
        setBizumPhone(data.value);
      }
    }
    void loadBizumPhone();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center animate-fade-up">
        <h1 className="text-3xl font-bold font-mono text-white mb-4">TU CARRITO ESTÁ VACÍO</h1>
        <p className="text-neutral-400 text-xs mb-6">Añade tus hamburguesas y combos favoritos antes de realizar el pedido.</p>
        <Link
          href="/menu"
          className="inline-block px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          IR AL MENÚ
        </Link>
      </div>
    );
  }

  const deliveryFee = 0; // Envío GRATIS en toda la zona
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customer_name || !formData.customer_phone || !formData.delivery_address) {
      setError('Por favor, completa todos los campos requeridos (*)');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        cash_change_for: formData.payment_method === 'CASH' && formData.cash_change_for ? parseFloat(formData.cash_change_for) : null,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      clearCart();
      router.push(`/orders/${data.orderNumber}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <Link href="/cart" className="flex items-center text-xs font-bold text-neutral-400 hover:text-white gap-1">
          <ArrowLeft size={16} /> Volver al carrito
        </Link>
        <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-widest">Paso Final</span>
      </div>

      <h1
        className="text-4xl font-bold tracking-wide mb-6 text-center"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-cream)' }}
      >
        FINALIZAR PEDIDO
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Datos Personales */}
        <section className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-yellow-500 flex items-center gap-2">
            1. Tus Datos de Contacto
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre y Apellidos *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Teléfono Móvil (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="612345678"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="juan@ejemplo.com"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección 2: Dirección */}
        <section className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-yellow-500 flex items-center gap-2">
            2. Dirección de Entrega en Sevilla
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Calle y Número *</label>
              <input
                type="text"
                required
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                placeholder="Ej: Calle Sinaí 14"
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Piso (Opcional)</label>
                <input
                  type="text"
                  value={formData.delivery_floor}
                  onChange={(e) => setFormData({ ...formData, delivery_floor: e.target.value })}
                  placeholder="Ej: 3º"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Puerta (Opcional)</label>
                <input
                  type="text"
                  value={formData.delivery_door}
                  onChange={(e) => setFormData({ ...formData, delivery_door: e.target.value })}
                  placeholder="Ej: B"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Código Postal *</label>
                <input
                  type="text"
                  required
                  value={formData.delivery_postal_code}
                  onChange={(e) => setFormData({ ...formData, delivery_postal_code: e.target.value })}
                  placeholder="41007"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Zona de Reparto *</label>
                <select
                  value={formData.delivery_zone}
                  onChange={(e) => setFormData({ ...formData, delivery_zone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm font-medium"
                >
                  <option value="Polígono San Pablo / 41007">Polígono San Pablo (41007)</option>
                  <option value="La Macarena">La Macarena</option>
                  <option value="Centro / Casco Antiguo">Centro / Casco Antiguo</option>
                  <option value="Hytasa">Hytasa</option>
                  <option value="El Corte Inglés Nervión">El Corte Inglés Nervión</option>
                  <option value="Otros alrededores">Otros alrededores</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Observaciones para el repartidor (Opcional)</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ej: Timbre averiado, llamar al llegar."
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Sección 3: Método de Pago (ÚNICAMENTE EFECTIVO / BIZUM) */}
        <section className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-yellow-500 flex items-center gap-2">
            3. Método de Pago Contra Entrega
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Opción Efectivo */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, payment_method: 'CASH' })}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 transition-all ${
                formData.payment_method === 'CASH'
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <Banknote size={28} />
              <span className="font-bold text-xs uppercase tracking-wider font-mono">EFECTIVO</span>
              <span className="text-[10px] text-neutral-400">Pago en mano al repartidor</span>
            </button>

            {/* Opción Bizum */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, payment_method: 'BIZUM' })}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 transition-all ${
                formData.payment_method === 'BIZUM'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <Wallet size={28} />
              <span className="font-bold text-xs uppercase tracking-wider font-mono">BIZUM</span>
              <span className="text-[10px] text-neutral-400">Transferencia al recibir</span>
            </button>
          </div>

          {/* Detalles dinámicos según pago */}
          {formData.payment_method === 'CASH' && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 animate-fade-up">
              <label className="block text-xs font-medium text-neutral-300">
                ¿Necesitas cambio? Indica con cuánto vas a pagar (€):
              </label>
              <input
                type="number"
                step="5"
                placeholder="Ej: 20 ó 50"
                value={formData.cash_change_for}
                onChange={(e) => setFormData({ ...formData, cash_change_for: e.target.value })}
                className="w-full max-w-xs p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
          )}

          {formData.payment_method === 'BIZUM' && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-900/60 space-y-2 animate-fade-up">
              <span className="text-xs font-bold text-purple-300 block uppercase font-mono">
                📱 Instrucciones de Pago por Bizum:
              </span>
              <p className="text-xs text-neutral-300">
                Podrás realizar el Bizum al repartidor en el momento exacto de la entrega al número oficial de La Esquina 51:
              </p>
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-purple-800/80 font-mono text-center text-lg font-bold text-purple-300 tracking-wider">
                {bizumPhone}
              </div>
            </div>
          )}
        </section>

        {/* Resumen del Pedido */}
        <section className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-yellow-500">Resumen Final</h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal ({items.length} líneas):</span>
              <span className="font-mono">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Gastos de Envío:</span>
              <span className="font-mono text-green-400 font-bold">¡GRATIS!</span>
            </div>
            <div className="border-t border-neutral-800 pt-3 flex justify-between items-center text-base font-bold text-white">
              <span>TOTAL A PAGAR:</span>
              <span className="text-2xl font-mono text-yellow-500 font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </section>

        {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-black uppercase tracking-wider text-lg shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-yellow)', fontFamily: 'Oswald, sans-serif' }}
        >
          {loading ? 'CONFIRMANDO PEDIDO...' : 'CONFIRMAR Y REALIZAR PEDIDO'}
        </button>

        <div className="flex items-center justify-center space-x-1 text-[10px] text-neutral-500 font-mono">
          <ShieldCheck size={14} />
          <span>Pago 100% seguro contra entrega sin comisiones ni tarjeta</span>
        </div>
      </form>
    </div>
  );
}
